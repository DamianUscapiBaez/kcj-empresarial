import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {encabezadosCargaMasiva,generarMatrizCargaMasiva,type RegistroHH} from '../lib/horas-hombre-kcj.ts';
const reg=(year:number,month:number,codigos:readonly string[]):RegistroHH=>({dni:'00123456',roster:'14x7',tipoPuesto:'PERSONAL OPERATIVO',dias:Object.fromEntries(codigos.map((x,i)=>[i+1,x])) as RegistroHH['dias']});
test('La plantilla de agosto mantiene exactamente A:AH, fechas AAAAMMDD y 34 columnas',()=>{
 const head=encabezadosCargaMasiva(2026,8);
 assert.equal(head.length,34);assert.deepEqual(head.slice(0,5),['DNI','Roster','TipoPuesto',20260801,20260802]);assert.equal(head.at(-1),20260831);
});
test('Febrero no bisiesto y febrero bisiesto tienen 31 y 32 columnas respectivamente',()=>{
 assert.equal(encabezadosCargaMasiva(2026,2).length,31);assert.equal(encabezadosCargaMasiva(2028,2).length,32);
});
test('12 diurno y 12N nocturno exportan 12 numérico; 0 permanece 0, sin perder DNI con cero',()=>{
 const codes=Array.from({length:31},(_,i)=>i===0?'12':i===1?'12N':'0');
 const out=generarMatrizCargaMasiva({year:2026,month:8,aprobado:true,trabajadores:[reg(2026,8,codes)]});
 assert.equal(out.length,2);assert.deepEqual(out[1].slice(0,6),['00123456','14x7','PERSONAL OPERATIVO',12,12,0]);
 assert.equal(typeof out[1][3],'number');
});
test('No se permite la descarga si Operaciones no ha aprobado el periodo',()=>{
 assert.throws(()=>generarMatrizCargaMasiva({year:2026,month:8,aprobado:false,trabajadores:[]}),/aprobar/);
});
test('Bloquea DNI duplicado, días faltantes, códigos no mapeados y exceso de días',()=>{
 const codes=Array(31).fill('0');const base=reg(2026,8,codes);
 const call=(trabajadores:RegistroHH[])=>generarMatrizCargaMasiva({year:2026,month:8,aprobado:true,trabajadores});
 assert.throws(()=>call([base,base]),/duplicado/);
 assert.throws(()=>call([reg(2026,8,codes.slice(0,30))]),/incompletos/);
 assert.throws(()=>call([reg(2026,8,[...codes.slice(0,4),'DD',...codes.slice(5)])]),/sin conversión/);
 assert.throws(()=>call([reg(2026,8,[...codes,'0'])]),/fuera de mes/);
});
test('Rechaza periodos imposibles y tipos de puesto desconocidos',()=>{
 assert.throws(()=>encabezadosCargaMasiva(2026,13),/Periodo/);
 const base={...reg(2026,8,Array(31).fill('0')),tipoPuesto:'OTRO' as RegistroHH['tipoPuesto']};
 assert.throws(()=>generarMatrizCargaMasiva({year:2026,month:8,aprobado:true,trabajadores:[base]}),/TipoPuesto/);
});

test('Los encabezados coinciden exactamente con la plantilla CargaMasivaHH.xlsx aportada por Operaciones',()=>{
 const original=JSON.parse(readFileSync(new URL('./fixtures/encabezados_carga_masiva_agosto_2026.json',import.meta.url),'utf8'));
 assert.equal(original.hoja,'Hoja1');
 assert.deepEqual(encabezadosCargaMasiva(original.anio,original.mes),original.encabezados);
});
