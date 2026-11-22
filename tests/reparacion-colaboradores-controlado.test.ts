import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd();
const file=path.join(root,'scripts/reparar-colaboradores-controlado.mjs');

test('La reparación de Colaboradores es solo diagnóstico por defecto',()=>{
 const t=readFileSync(file,'utf8');
 assert.match(t,/const op=process\.argv\[2\]\|\|'--diagnostico'/);
 assert.match(t,/KCJ_CONFIRMAR_MIGRACION/);
 assert.match(t,/pg_dump/);
 assert.match(t,/pg_restore/);
 assert.match(t,/prismaCmd,\['migrate','deploy'\]/);
 assert.doesNotMatch(t,/\['migrate','reset'\]|\['db','push'\]/);
});

test('Sin URL de base de datos falla antes de abrir PostgreSQL o migrar',()=>{
 const env={...process.env,DATABASE_URL:''};
 const result=spawnSync(process.execPath,[file,'--aplicar'],{cwd:root,env,encoding:'utf8'});
 assert.equal(result.status,2);
 assert.match(result.stderr,/FALTA DATABASE_URL/);
 assert.doesNotMatch(result.stderr,/migración concluida|ESTRUCTURA CORRECTA/);
});

test('El SQL para segunda área es aditivo y conserva los registros existentes',()=>{
 const sql=readFileSync(path.join(root,'prisma/migrations/20261121000700_areas_principal_segunda/migration.sql'),'utf8');
 assert.match(sql,/ADD COLUMN "secondaryArea" TEXT/);
 assert.match(sql,/CREATE TABLE "WorkArea"/);
 assert.doesNotMatch(sql,/\bDROP TABLE\b|\bTRUNCATE\b|\bDELETE FROM\b/i);
});
