import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {identificacionUniforme,identificacionOpcional} from '../lib/normalizacion-datos.ts';
const sql=readFileSync(new URL('../prisma/migrations/20261127002000_normalizacion_identificacion/migration.sql',import.meta.url),'utf8');
test('Nombres, tildes, Ñ, espacios y códigos',()=>{
 assert.equal(identificacionUniforme('  Oscar   ninaya Sarmiento '),'OSCAR NINAYA SARMIENTO');
 assert.equal(identificacionUniforme('María Muñoz'),'MARÍA MUÑOZ');
 assert.equal(identificacionUniforme('Jose\u0301'),'JOSÉ');
 assert.equal(identificacionUniforme('kcj-025'),'KCJ-025');
 assert.equal(identificacionOpcional(null),null);
});
test('Normalización idempotente',()=>{const x=identificacionUniforme('  razón social  ');assert.equal(identificacionUniforme(x),x);});
test('Migración audita cambios y bloquea colisiones antes de actualizar',()=>{
 assert.match(sql,/BEGIN;/);assert.match(sql,/COMMIT;/);assert.match(sql,/NORMALIZACION_IDENTIFICACION/);
 assert.ok(sql.indexOf('RAISE EXCEPTION')<sql.indexOf('UPDATE "Worker" SET'));
 assert.equal((sql.match(/CREATE TRIGGER/g)||[]).length,6);
 assert.doesNotMatch(sql,/NEW\."(?:login|passwordHash|area|secondaryArea|route|mineCode)"/);
});
