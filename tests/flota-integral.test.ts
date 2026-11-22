import test from "node:test";
import assert from "node:assert/strict";
import {catalogoChecklist,catalogoEquipamiento,validarChecklist,validarInventario,catalogItem} from "../lib/vehiculos-integrados.ts";
const tipos=["CAMIONETA","MICROBUS","MINIBUS","OMNIBUS"];
for(const tipo of tipos){
 test(`Flota ${tipo}: catálogo consistente sin ítems duplicados`,()=>{
  const items=catalogoChecklist(tipo);
  assert.ok(items.length>=25);
  assert.equal(new Set(items.map(x=>x.code)).size,items.length);
  assert.ok(items.some(x=>x.code==="LUZ_RETROCESO"));
  assert.ok(items.some(x=>x.code==="ALARMA_RETROCESO"));
  assert.ok(items.some(x=>x.code==="DVR"));
  assert.ok(items.some(x=>x.code==="GPS"));
  assert.ok(items.some(x=>x.code==="NEUM_DEL_IZQ"));
 });
 test(`Flota ${tipo}: checklist con todos conformes`,()=>{
  const data=catalogoChecklist(tipo).map(x=>({code:x.code,result:"CONFORME" as const,note:""}));
  assert.equal(validarChecklist(tipo,data).status,"CONFORME");
 });
 test(`Flota ${tipo}: hallazgo crítico genera estado crítico`,()=>{
  const data=catalogoChecklist(tipo).map(x=>({code:x.code,result:x.code==="FRENOS"?"NO_CONFORME" as const:"CONFORME" as const,note:x.code==="FRENOS"?"No funciona el frenado":""}));
  assert.equal(validarChecklist(tipo,data).status,"CRITICO");
 });
 test(`Flota ${tipo}: no acepta checklist incompleto`,()=>assert.throws(()=>validarChecklist(tipo,[]),/todos/));
 test(`Flota ${tipo}: no acepta NO_APLICA en elemento obligatorio`,()=>{
  const data=catalogoChecklist(tipo).map(x=>({code:x.code,result:x.code==="FRENOS"?"NO_APLICA" as const:"CONFORME" as const,note:"No corresponde según operador"}));
  assert.throws(()=>validarChecklist(tipo,data),/obligatorio/);
 });
 test(`Flota ${tipo}: inventario catálogo único y cantidades`,()=>{
  const eq=catalogoEquipamiento(tipo);assert.ok(eq.length>5);assert.ok(eq.every(x=>x.quantity));
  assert.equal(catalogItem(tipo,"EXTINTOR").label.startsWith("Extintor"),true);
 });
}
test("No permite tipos de unidad distintos a los cuatro aprobados",()=>assert.throws(()=>catalogoChecklist("CAMION"),/Tipo de unidad/));
test("No permite componentes fuera del catálogo",()=>assert.throws(()=>catalogItem("CAMIONETA","EXTRA_NO_AUTORIZADO"),/no permitido/));
test("No permite cantidades negativas",()=>assert.throws(()=>validarInventario({expected:2,actual:-1,condition:"CONFORME",functionalStatus:"OPERATIVO"}),/Cantidad/));
test("Un faltante debe estar justificado",()=>assert.throws(()=>validarInventario({expected:2,actual:1,condition:"OBSERVADO",functionalStatus:"OPERATIVO"}),/observación/));
test("Un faltante con explicación sí se registra",()=>assert.doesNotThrow(()=>validarInventario({expected:2,actual:1,condition:"OBSERVADO",functionalStatus:"OPERATIVO",remarks:"Falta un elemento"})));
test("Checklist: la misma luz y la alarma tienen códigos distintos",()=>assert.notEqual(catalogoChecklist("CAMIONETA").find(x=>x.code==="LUZ_RETROCESO")?.code,catalogoChecklist("CAMIONETA").find(x=>x.code==="ALARMA_RETROCESO")?.code));
import {readFileSync} from "node:fs";
const root=new URL("../",import.meta.url);
const src=(p:string)=>readFileSync(new URL(p,root),"utf8");
test("Prisma incluye inventario y checklist vinculados a Vehicle",()=>{
 const schema=src("prisma/schema.prisma");
 for(const marker of ["model VehicleEquipment", "model VehicleChecklist","equipment VehicleEquipment[]","checklists VehicleChecklist[]","clientEventId String @unique"])assert.ok(schema.includes(marker));
});
test("Migración 008 solo añade estructura y no borra unidades",()=>{
 const sql=src("prisma/migrations/20261121000800_ficha_vehicular_equipamiento_checklist/migration.sql");
 for(const name of ["VehicleEquipment","VehicleChecklist","Inspection","Clearance"])assert.ok(sql.includes(name));
 assert.doesNotMatch(sql,/DROP TABLE|TRUNCATE|DELETE FROM|migrate reset/i);
});
test("La inspección diaria exige servicio real, valida ítems y es idempotente",()=>{
 const action=src("app/actions-aula.ts");
 for(const name of ["validarChecklist(linked.vehicle.type,entries)","linked.workerId!==workerId","linked.vehicleId!==vehicleId","serviceId=field(form,\"serviceId\")","findUnique({where:{clientEventId}})","REGISTRAR_CHECKLIST_DIARIO"])assert.ok(action.includes(name),name);
});
test("Inspecciones críticas abren caso SSOMA sin simular conformidad",()=>{
 const actions=src("app/actions-vehiculos.ts")+src("app/actions-aula.ts");
 assert.match(actions,/status===\"CRITICO\"/);assert.match(actions,/safetyCase\.create/);
});
test("Evidencias nuevas verifican propiedad de sesión",()=>{
 assert.match(src("lib/evidencias.ts"),/asset\.uploadedBy!==actorId/);
 assert.match(src("app/actions-aula.ts"),/requireEvidenceOwned\(evidence,\"CONNECT\",u.id\)/);
 assert.match(src("app/actions-vehiculos.ts"),/requireEvidenceOwned\(evidenceKey,\"FLOTA\",user.id\)/);
});
