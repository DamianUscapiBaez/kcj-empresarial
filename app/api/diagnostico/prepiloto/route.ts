import {NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {rolesActivos} from "@/lib/permisos-kcj";
import {prisma} from "@/lib/prisma";
import {TABLAS_KCJ,COLUMNAS_CRITICAS_KCJ,MIGRACIONES_KCJ} from "@/lib/esquema-requerido-kcj";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};
type Tabla={table_name:string};type Columna={table_name:string;column_name:string};
type Migracion={migration_name:string;finished_at:Date|null;rolled_back_at:Date|null};
/** Diagnóstico estructural de solo lectura, exclusivamente ADMIN, sin datos personales. */
export async function GET(){
 try{
  const u=await currentUser();
  if(!u)return NextResponse.json({error:"Autenticación necesaria"},{status:401,headers});
  if(!rolesActivos(u).includes("ADMIN"))return NextResponse.json({error:"Solo ADMIN"},{status:403,headers});
  const [tablas,columnas]=await Promise.all([
   prisma.$queryRaw<Tabla[]>`SELECT table_name FROM information_schema.tables WHERE table_schema=current_schema() AND table_type='BASE TABLE'`,
   prisma.$queryRaw<Columna[]>`SELECT table_name,column_name FROM information_schema.columns WHERE table_schema=current_schema()`,
  ]);
  const presente=new Set(tablas.map(x=>x.table_name)),colPresente=new Set(columnas.map(x=>`${x.table_name}.${x.column_name}`));
  const faltanTablas=TABLAS_KCJ.filter(x=>!presente.has(x));
  const faltanColumnas=COLUMNAS_CRITICAS_KCJ.filter(x=>!colPresente.has(`${x.table}.${x.column}`));
  let pendientes=[...MIGRACIONES_KCJ] as string[],fallidas:string[]=[];
  if(presente.has("_prisma_migrations")){
   const rows=await prisma.$queryRaw<Migracion[]>`SELECT migration_name,finished_at,rolled_back_at FROM "_prisma_migrations"`;
   const aplicadas=new Set(rows.filter(x=>x.finished_at&&!x.rolled_back_at).map(x=>x.migration_name));
   pendientes=MIGRACIONES_KCJ.filter(x=>!aplicadas.has(x));
   fallidas=rows.filter(x=>!x.finished_at&&!x.rolled_back_at).map(x=>x.migration_name);
  }
  const adminAccounts=presente.has("User")?await prisma.user.count({where:{role:"ADMIN",active:true}}):0;
  const evidenceStorageConfigured=Boolean(process.env.KCJ_S3_BUCKET&&process.env.KCJ_S3_REGION&&process.env.KCJ_S3_ACCESS_KEY_ID&&process.env.KCJ_S3_SECRET_ACCESS_KEY);
  const schemaReady=!faltanTablas.length&&!faltanColumnas.length&&!pendientes.length&&!fallidas.length;
  const status=schemaReady&&adminAccounts>0&&evidenceStorageConfigured?"estructura_lista_para_ensayo":"pendiente_preparacion";
  return NextResponse.json({status,scope:"Solo infraestructura y estructura; no prueba formularios, navegacion o permisos funcionales",checkedAt:new Date().toISOString(),schema:{modelsExpected:TABLAS_KCJ.length,missingTables:faltanTablas,missingColumns:faltanColumnas,pendingMigrations:pendientes,failedMigrations:fallidas},accounts:{hasActiveAdmin:adminAccounts>0},evidence:{storageConfigured:evidenceStorageConfigured},next:"Verificar respaldo, restauración y pruebas de usuarios con PostgreSQL de ensayo. No ejecutar reset ni cambios desde esta ruta."},{status:status==="estructura_lista_para_ensayo"?200:503,headers});
 }catch(error){console.error("[KCJ_PREPILOTO_DIAGNOSTICO]",{code:(error as {code?:string})?.code??"NO_CODE"});return NextResponse.json({status:"error",code:"KCJ_PREPILOTO_DIAGNOSTICO_ERROR",recommendation:"Revisar conexión, esquema y registros privados; no modificar datos de producción"},{status:503,headers});}
}
