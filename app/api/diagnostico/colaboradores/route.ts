import {NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {rolesActivos} from "@/lib/permisos-kcj";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const headers={"Cache-Control":"no-store"};
const requiredTables=["Worker","WorkArea"] as const;
const requiredColumns=["id","name","document","area","secondaryArea","active","license","licenseExpires"] as const;
const expectedMigration="20261121000700_areas_principal_segunda";

type TableRow={table_name:string};
type ColumnRow={column_name:string};
type MigrationRow={migration_name:string;finished_at:Date|null;rolled_back_at:Date|null};

/** Solo metadatos y sondas limitadas. Nunca retorna documentos personales ni credenciales. */
export async function GET(){
 try {
  const user=await currentUser();
  if(!user)return NextResponse.json({error:"Autenticación requerida"},{status:401,headers});
  if(!rolesActivos(user).includes("ADMIN"))return NextResponse.json({error:"Permiso denegado"},{status:403,headers});

  const [tableRows,columnRows]=await Promise.all([
   prisma.$queryRaw<TableRow[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema=current_schema() AND table_name IN ('Worker','WorkArea')`,
   prisma.$queryRaw<ColumnRow[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema=current_schema() AND table_name='Worker'
      AND column_name IN ('id','name','document','area','secondaryArea','active','license','licenseExpires')`,
  ]);
  const foundTables=new Set(tableRows.map(x=>x.table_name));
  const foundColumns=new Set(columnRows.map(x=>x.column_name));
  const missingTables=requiredTables.filter(name=>!foundTables.has(name));
  const missingColumns=requiredColumns.filter(name=>!foundColumns.has(name));

  // Consulta únicamente si la tabla de migraciones está presente, sin requerir privilegios de escritura.
  const migrationsTable=await prisma.$queryRaw<TableRow[]>`
   SELECT table_name FROM information_schema.tables
   WHERE table_schema=current_schema() AND table_name='_prisma_migrations'`;
  let migrationStatus:"applied"|"pending_or_failed"|"tracking_table_missing"="tracking_table_missing";
  if(migrationsTable.length){
   const migration=await prisma.$queryRaw<MigrationRow[]>`
    SELECT migration_name,finished_at,rolled_back_at FROM "_prisma_migrations"
    WHERE migration_name=${expectedMigration} ORDER BY started_at DESC LIMIT 1`;
   migrationStatus=migration.some(m=>m.finished_at!==null&&m.rolled_back_at===null)?"applied":"pending_or_failed";
  }

  // Prisma consulta la misma combinación que la pantalla. No se devuelven filas de trabajadores.
  const probeResults=await Promise.allSettled([
   prisma.worker.findMany({select:{id:true,name:true,document:true,area:true,secondaryArea:true,active:true,license:true,licenseExpires:true},take:1}),
   prisma.workArea.findMany({select:{name:true},where:{active:true},take:1}),
  ]);
  const probes=probeResults.map((result,index)=>({
   query:index===0?"Worker":"WorkArea",
   status:result.status==="fulfilled"?"ok":"error",
   code:result.status==="rejected"&&typeof result.reason?.code==="string"?result.reason.code:"N/A",
  }));
  const healthy=missingTables.length===0&&missingColumns.length===0&&migrationStatus==="applied"&&probes.every(x=>x.status==="ok");
  return NextResponse.json({
   status:healthy?"ok":"error",
   module:"Colaboradores",
   schema:{missingTables,missingColumns,migration:expectedMigration,migrationStatus},
   probes,
   recommendation:healthy?"Estructura y consultas correctas; revisar logs del despliegue asociados al digest de la pantalla.":
    "Revisar copia de seguridad, estado de migraciones y logs de Vercel antes de autorizar prisma migrate deploy. No ejecutar db push/reset.",
   checkedAt:new Date().toISOString(),
  },{status:healthy?200:503,headers});
 }catch(error:unknown){
  const code=typeof (error as {code?:unknown})?.code==="string"?(error as {code:string}).code:"N/A";
  // Solo código estructurado en respuesta; no se exponen conexión, SQL ni datos.
  console.error("[KCJ_DIAGNOSTICO_COLABORADORES]",{code});
  return NextResponse.json({status:"error",module:"Colaboradores",code,
   recommendation:"Revisar acceso a PostgreSQL y registros de Vercel. Si el login funciona, verificar privilegios para leer metadatos y migraciones."},
   {status:503,headers});
 }
}
