import test from 'node:test';
import assert from 'node:assert/strict';
import {fechaHoraPeru} from '../lib/fechas-kcj.ts';

test('Hora Perú fija -05 al programar guardia diurna',()=>{
 assert.equal(fechaHoraPeru('2026-11-22T08:00','startsAt').toISOString(),'2026-11-22T13:00:00.000Z');
});
test('Turno nocturno al día siguiente no se convierte a otra fecha equivocada',()=>{
 const a=fechaHoraPeru('2026-11-22T19:00','startsAt');
 const b=fechaHoraPeru('2026-11-23T07:00','endsAt');
 assert.equal((b.getTime()-a.getTime())/3600000,12);
});
test('Vencimiento por fecha abarca fin de día Perú',()=>{
 assert.equal(fechaHoraPeru('2026-11-22','validUntil').toISOString(),'2026-11-23T04:59:59.000Z');
 assert.equal(fechaHoraPeru('2026-11-22','issuedAt').toISOString(),'2026-11-22T05:00:00.000Z');
});
test('Calendario bisiesto y 29 de febrero',()=>{
 assert.equal(fechaHoraPeru('2028-02-29','startsAt').getTime(),Date.parse('2028-02-29T05:00:00Z'));
 for (const date of ['2026-02-29','2026-02-30','2026-04-31','2026-00-10','2026-13-01','2026-11-00','0000-01-01','2026-11-22T24:00','2026-11-22T10:60','2026-11-22T10:01:60','2026-11-22T09:00+15:00','2026-11-22T09:00-05:60','sin fecha']){
  assert.throws(()=>fechaHoraPeru(date,'startsAt'),Error,date);
 }
});
test('Acepta fechas ISO explícitamente zonificadas',()=>{
 assert.equal(fechaHoraPeru('2026-11-22T13:00:00Z','startsAt').toISOString(),'2026-11-22T13:00:00.000Z');
 assert.equal(fechaHoraPeru('2026-11-22T08:00:00-05:00','startsAt').toISOString(),'2026-11-22T13:00:00.000Z');
});
