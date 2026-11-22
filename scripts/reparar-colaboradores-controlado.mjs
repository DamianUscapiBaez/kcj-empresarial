#!/usr/bin/env node
/**
 * KCJ CONTROL: verificación y aplicación controlada de migraciones.
 * - Por defecto: SOLO LECTURA, no modifica registros ni esquema.
 * - --aplicar: solo con consentimiento, copia pg_dump comprobada y ausencia de migraciones fallidas.
 * - Ejecuta el historial Prisma SIN ALTERAR las migraciones existentes ni falsear su estado.
 * Uso: node scripts/reparar-colaboradores-controlado.mjs [--diagnostico|--aplicar]
 */
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const TARGET='20261121000700_areas_principal_segunda';
const HELP=`KCJ CONTROL — reparación controlada de Colaboradores\n\n`+
 `Diagnóstico (solo lectura): node scripts/reparar-colaboradores-controlado.mjs --diagnostico\n`+
 `Aplicación autorizada: KCJ_CONFIRMAR_MIGRACION=SI KCJ_ENTORNO=ensayo|produccion node scripts/reparar-colaboradores-controlado.mjs --aplicar\n`+
 `Requiere: Node 22+, npm install, prisma generate, DATABASE_URL, pg_dump y pg_restore.\n`+
 `ANTES de producción: ensayar con una copia de PostgreSQL y verificar restauración de respaldos.\n`;
if(process.argv.includes('--help')||process.argv.includes('-h')){console.log(HELP);process.exit(0);}
const op=process.argv[2]||'--diagnostico';
if(!['--diagnostico','--aplicar'].includes(op)){console.error(HELP);process.exit(2);}
if(fs.existsSync('.env')&&typeof process.loadEnvFile==='function')process.loadEnvFile('.env');
if(!process.env.DATABASE_URL){console.error('FALTA DATABASE_URL. No se ha modificado nada.');process.exit(2);}
let PrismaClient;
try { ({PrismaClient}=await import('@prisma/client')); }
catch {console.error('FALTAN dependencias/Prisma Client. Ejecutar npm install y npx prisma generate. No se ha modificado nada.');process.exit(2);}
const prisma=new PrismaClient({log:['error']});
const requiredTables=['Worker','User','WorkArea'];
const requiredColumns=['id','name','document','area','secondaryArea','active','license','licenseExpires'];
const root=process.cwd();
async function inspect(){
 const [tables,columns,tracking]=await Promise.all([
  prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema=current_schema() AND table_name IN ('Worker','User','WorkArea')`,
  prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='Worker'`,
  prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema=current_schema() AND table_name='_prisma_migrations'`,
 ]);
 const tableSet=new Set(tables.map(x=>x.table_name));
 const columnSet=new Set(columns.map(x=>x.column_name));
 const missingTables=requiredTables.filter(x=>!tableSet.has(x));
 const missingColumns=requiredColumns.filter(x=>!columnSet.has(x));
 let migrations=[];
 if(tracking.length){migrations=await prisma.$queryRaw`SELECT migration_name,finished_at,rolled_back_at FROM "_prisma_migrations" ORDER BY started_at`}
 const active=migrations.filter(x=>x.rolled_back_at===null);
 const failed=active.filter(x=>x.finished_at===null).map(x=>x.migration_name);
 const applied=new Set(active.filter(x=>x.finished_at!==null).map(x=>x.migration_name));
 const migrationStatus=applied.has(TARGET)?'aplicada':failed.includes(TARGET)?'fallida':'pendiente';
 const workerCount=tableSet.has('Worker')?Number((await prisma.$queryRaw`SELECT COUNT(*)::bigint AS n FROM "Worker"`)[0].n):null;
 const userCount=tableSet.has('User')?Number((await prisma.$queryRaw`SELECT COUNT(*)::bigint AS n FROM "User"`)[0].n):null;
 return {status:missingTables.length||missingColumns.length||migrationStatus!=='aplicada'?'pendiente':'estructura_correcta',
   missingTables,missingColumns,migrationStatus,failedMigrations:failed,
   trackingTablePresent:Boolean(tracking.length),workerCount,userCount,appliedMigrations:[...applied]};
}
function run(binary,args,opts={}){
 const result=spawnSync(binary,args,{cwd:root,env:opts.env||process.env,encoding:'utf8',stdio:opts.quiet?'pipe':'inherit',timeout:120000});
 if(result.error||result.status!==0)throw new Error(`${path.basename(binary)} falló: código ${result.status??'desconocido'}`);
 return result;
}
let before;
try{
 before=await inspect();
 const {appliedMigrations,...publicBefore}=before;
 console.log(JSON.stringify({etapa:'antes',...publicBefore},null,2));
 if(op==='--diagnostico')process.exitCode=before.status==='estructura_correcta'?0:3;
 else {
  if(process.env.KCJ_CONFIRMAR_MIGRACION!=='SI')throw new Error('Falta KCJ_CONFIRMAR_MIGRACION=SI; ninguna migración ejecutada');
  if(!['ensayo','produccion'].includes(process.env.KCJ_ENTORNO))throw new Error('Defina KCJ_ENTORNO=ensayo o produccion');
  if(!before.trackingTablePresent||before.missingTables.includes('Worker')||before.missingTables.includes('User'))
   throw new Error('Falta estructura base o historial de migraciones; se requiere revisión manual antes de ejecutar');
  if(before.failedMigrations.length)throw new Error(`Existen migraciones fallidas (${before.failedMigrations.join(', ')}). NO se modifica su historial automáticamente`);
  if(before.migrationStatus==='aplicada' && before.status!=='estructura_correcta')
   throw new Error('La migración consta aplicada, pero la estructura no corresponde: posible deriva. NO se altera el historial automáticamente');
  if(before.status==='estructura_correcta'){
   console.log('Colaboradores ya tiene la estructura esperada. No se ejecutan migraciones.');
  }else{
   const prismaCmd=path.join(root,'node_modules','.bin',process.platform==='win32'?'prisma.cmd':'prisma');
   if(!fs.existsSync(prismaCmd))throw new Error('Prisma local no instalado. Instale dependencias antes de aplicar');
   const dirs=fs.readdirSync(path.join(root,'prisma','migrations'),{withFileTypes:true})
    .filter(d=>d.isDirectory() && fs.existsSync(path.join(root,'prisma','migrations',d.name,'migration.sql')))
    .map(d=>d.name).sort();
   const appliedSet=new Set(before.appliedMigrations);
   const pending=dirs.filter(d=>!appliedSet.has(d));
   if(pending.length===0)throw new Error('No hay migraciones pendientes, pero faltan tablas/columnas: revisión manual requerida');
   if(!pending.includes(TARGET))throw new Error('La migración esperada no figura pendiente: revisar diferencias entre código y BD');
   // Condiciones conservadoras: nunca aplicar sin revisión las operaciones destructivas conocidas.
   for(const name of pending){
    let sql=fs.readFileSync(path.join(root,'prisma','migrations',name,'migration.sql'),'utf8');
    // Excepción revisada: v3 reemplaza una restricción conocida por su versión ampliada.
    if(name==='20261121001200_custodia_firma_v3_y_evidencias_tamano'){
      sql=sql.replace(/ALTER TABLE "CustodyEvent" DROP CONSTRAINT IF EXISTS "CustodyEvent_contentVersion_chk";/g,'');
    }
    if(/\b(?:DROP\s+(?:TABLE|COLUMN|SCHEMA)|TRUNCATE|DELETE\s+FROM|ALTER\s+TABLE\s+[^;]*\sDROP\s|RENAME\s+(?:TO|COLUMN))\b/i.test(sql))
     throw new Error(`La migración pendiente ${name} requiere revisión SQL adicional por contener operaciones potencialmente destructivas`);
   }
   console.log('Migraciones pendientes de la copia local:',pending.join(', '));
   const backupDir=path.join(root,'respaldos_kcj_privados');
   fs.mkdirSync(backupDir,{recursive:true,mode:0o700});
   const timestamp=new Date().toISOString().replace(/[:.]/g,'-');
   const file=path.join(backupDir,`kcj_antes_colaboradores_${timestamp}.dump`);
   // PGDATABASE en entorno evita exponer URL/contraseña en argumentos de procesos.
   const dumpEnv={...process.env,PGDATABASE:process.env.DATABASE_URL};
   console.log('Creando respaldo PostgreSQL cifrable/privado en ubicación local; no se transmiten credenciales en la salida...');
   run('pg_dump',['--format=custom','--no-owner','--no-acl','--file',file],{env:dumpEnv,quiet:true});
   fs.chmodSync(file,0o600);
   if(fs.statSync(file).size<512)throw new Error('Respaldo demasiado pequeño para verificar; migración detenida');
   run('pg_restore',['--list',file],{env:dumpEnv,quiet:true});
   console.log('Respaldo creado y listado validado. No se restaura automáticamente ni se borra información.');
   run(prismaCmd,['migrate','deploy']);
   const after=await inspect();
   const {appliedMigrations:_,...publicAfter}=after;
   console.log(JSON.stringify({etapa:'despues',...publicAfter},null,2));
   if(after.status!=='estructura_correcta')throw new Error('La migración concluyó pero Colaboradores sigue incompleto: requiere revisión');
   if(after.workerCount < before.workerCount || after.userCount < before.userCount)
    throw new Error('Se detectó disminución de registros de trabajadores o usuarios; detener despliegue e investigar');
   console.log(`ESTRUCTURA CORRECTA. Trabajadores: ${before.workerCount} → ${after.workerCount}. Usuarios: ${before.userCount} → ${after.userCount}.`);
   console.log('Pendiente: comprobar creación de trabajador/usuario con cuentas ficticias en entorno de ensayo.');
  }
 }
}catch(e){
 console.error('PROCESO DETENIDO:',e?.message||'error');
 process.exitCode=2;
}finally{await prisma.$disconnect();}
