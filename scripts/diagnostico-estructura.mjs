import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/** Diagnóstico estático: comprueba scripts presentes, NO tablas ejecutadas en PostgreSQL. */
const root=process.cwd();
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const errors=[];
const schema=read('prisma/schema.prisma');
const models=[...schema.matchAll(/^model\s+([A-Za-z][A-Za-z0-9]*)\s*\{/gm)].map(x=>x[1]);
const migrationsRoot=path.join(root,'prisma/migrations');
const migrations=fs.readdirSync(migrationsRoot,{withFileTypes:true})
 .filter(d=>d.isDirectory()&&fs.existsSync(path.join(migrationsRoot,d.name,'migration.sql')))
 .map(d=>d.name).sort();
const sqlByMigration=migrations.map(name=>({name,sql:read(`prisma/migrations/${name}/migration.sql`)}));
const tables=[...new Set(sqlByMigration.flatMap(({sql})=>[...sql.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"([A-Za-z][A-Za-z0-9]*)"/gi)].map(x=>x[1])))];
for(const model of models)if(!tables.includes(model))errors.push(`No hay CREATE TABLE del modelo ${model} entre las migraciones disponibles`);
for(const table of tables)if(!models.includes(table))errors.push(`Tabla ${table} sin modelo Prisma`);
if(sqlByMigration.some(({sql})=>/\bDROP\s+(?:TABLE|SCHEMA)\b/i.test(sql)))errors.push('Existe DROP TABLE/SCHEMA en una migración: revisar antes de aplicar');
for(const file of ['package.json','app/layout.tsx','app/login/page.tsx','app/dashboard/page.tsx','lib/prisma.ts','prisma/seed.ts','.github/workflows/validacion.yml'])
 if(!fs.existsSync(path.join(root,file)))errors.push(`Falta ${file}`);
const lock=fs.existsSync(path.join(root,'package-lock.json'));
const nodeMajor=Number(process.versions.node.split('.')[0]);
if(nodeMajor<22)errors.push('Node.js 22+ requerido');
const summary={status:errors.length?'ERROR':'OK',scope:'SOLO ARCHIVOS LOCALES; NO VERIFICA POSTGRESQL',node:process.version,models:models.length,migrations:migrations.length,tablesAcrossMigrations:tables.length,lockfile:lock?'presente':'pendiente de generar con npm install en TI',errors};
console.log(JSON.stringify(summary,null,2));
if(errors.length)process.exitCode=1;
