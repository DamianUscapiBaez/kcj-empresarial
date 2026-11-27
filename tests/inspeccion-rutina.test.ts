import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {catalogoRutina,validarRutina,type ItemRutina,type RespuestaRutina} from '../lib/inspeccion-rutina.ts';
const src=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const base=(tipo='CAMIONETA')=>catalogoRutina(tipo,[],'INSITE',false,false,false);
const item=(items:ItemRutina[],code:string)=>items.find(x=>x.code===code)!;
const answers=(items:ItemRutina[]):RespuestaRutina[]=>items.map(x=>({code:x.code,result:'CONFORME',note:'',found:x.quantity?Math.max(1,x.minimum??1):null,detail:'Detalle comprobado'}));
for(const [type,ext,gasas] of [['CAMIONETA',1,5],['MICROBUS',1,15],['MINIBUS',1,15],['OMNIBUS',2,15]] as const){
 test(`${type}: cantidades diferenciadas y códigos únicos`,()=>{const r=base(type);assert.equal(item(r,'EXTINTOR').minimum,ext);assert.equal(item(r,'B_GASA').minimum,gasas);assert.equal(new Set(r.map(x=>x.code)).size,r.length);assert.equal(validarRutina(r,answers(r)).status,'CONFORME');});
}
test('Camioneta DASH CAM, no DVR ni chaleco de dotación',()=>{const r=base();assert.ok(item(r,'DASH_CAM'));assert.ok(!item(r,'DVR'));assert.ok(!item(r,'CHALECOS'));});
test('OFFSITE y escolta varían los requisitos',()=>{const a=catalogoRutina('CAMIONETA',[],'OFFSITE',true,false,false);assert.equal(item(a,'KIT_PANOS').minimum,25);assert.equal(item(a,'REPUESTO').minimum,2);assert.equal(item(catalogoRutina('OMNIBUS',[],'OFFSITE',false,false,false),'B_OXIGENO').minimum,1);assert.ok(!item(base('OMNIBUS'),'B_OXIGENO'));});
test('Faltante no puede quedar conforme',()=>{const r=base(),a=answers(r);a.find(x=>x.code==='CUÑAS')!.found=1;assert.throws(()=>validarRutina(r,a),/insuficiente/);});
test('No aplica justificado no genera observado',()=>{const r=base(),a=answers(r);Object.assign(a.find(x=>x.code==='B_TIJERAS')!,{result:'NO_APLICA',found:null,note:'No equipa'});assert.equal(validarRutina(r,a).status,'CONFORME');});
test('No aplica obligatorio se rechaza',()=>{const r=base(),a=answers(r);Object.assign(a.find(x=>x.code==='CUÑAS')!,{result:'NO_APLICA',found:null,note:'No equipa'});assert.throws(()=>validarRutina(r,a),/No aplica/);});
test('Hallazgo crítico y observación se distinguen',()=>{const r=base(),a=answers(r);Object.assign(a.find(x=>x.code==='FRENOS')!,{result:'NO_CONFORME',note:'Frenos deficientes'});assert.equal(validarRutina(r,a).status,'CRITICO');});
test('No sobrescribe configuración ni omite ítems existentes',()=>{const r=catalogoRutina('MINIBUS',[{itemCode:'EXTRA_REAL',label:'Accesorio real',expectedQuantity:2,actualQuantity:2}],'INSITE',false,false,false);assert.equal(item(r,'EXTRA_REAL').minimum,2);assert.throws(()=>validarRutina(r,answers(r).slice(1)),/todos/);});
test('Registro usa cuenta, transacción, caso crítico y auditoría sin alterar custodia',()=>{const a=src('app/actions-vehiculos.ts').split('export async function registrarInspeccionRutina')[1];for(const m of ['requireRole','performedBy:user.id','tx.vehicleChecklist.create','tx.auditLog.create','tx.safetyCase.create','Serializable','prior.performedBy!==user.id'])assert.ok(a.includes(m));assert.doesNotMatch(a,/vehicleEquipment\.update|custodyEvent\.create|odometerReading\.create/);});
