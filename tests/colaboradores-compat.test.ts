import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {cargarColaboradoresCompat,errorEstructuraPrisma,type OrigenColaboradores} from "../lib/colaboradores-compat.ts";

const base={id:"test-1",document:"TEST0001",name:"Prueba",area:"Operaciones",active:true,license:null,licenseExpires:null};
const area={name:"Operaciones"};
function source(overrides:Partial<OrigenColaboradores>={}):OrigenColaboradores{
 return {
  listarVigentes:async()=>[{...base,secondaryArea:"SSOMA"}],
  listarBase:async()=>[base],
  listarAreas:async()=>[area],
  ...overrides,
 };
}
const absentColumn=()=>Promise.reject({code:"P2022",meta:{column:"Worker.secondaryArea"}});
const absentTable=()=>Promise.reject({code:"P2021",meta:{table:"WorkArea"}});

test("Colaboradores: esquema completo habilita lectura y formularios",async()=>{
 const r=await cargarColaboradoresCompat(source());
 assert.equal(r.soloLectura,false);
 assert.equal(r.workerPendiente,false);
 assert.equal(r.catalogoPendiente,false);
 assert.equal(r.people[0].secondaryArea,"SSOMA");
 assert.deepEqual(r.catalog,[area]);
});
test("Colaboradores: columna faltante permite ver registros históricos sin modificar",async()=>{
 const r=await cargarColaboradoresCompat(source({listarVigentes:absentColumn}));
 assert.equal(r.soloLectura,true);
 assert.equal(r.workerPendiente,true);
 assert.equal(r.catalogoPendiente,false);
 assert.equal(r.people[0].name,"Prueba");
 assert.equal(r.people[0].secondaryArea,null);
});
test("Colaboradores: catálogo faltante deshabilita cambios pero muestra padrón",async()=>{
 const r=await cargarColaboradoresCompat(source({listarAreas:absentTable}));
 assert.equal(r.soloLectura,true);
 assert.equal(r.catalogoPendiente,true);
 assert.equal(r.people[0].secondaryArea,"SSOMA");
 assert.deepEqual(r.catalog,[]);
});
test("Colaboradores: migración ausente para ambos elementos mantiene consulta",async()=>{
 const r=await cargarColaboradoresCompat(source({listarVigentes:absentColumn,listarAreas:absentTable}));
 assert.equal(r.soloLectura,true);
 assert.equal(r.workerPendiente,true);
 assert.equal(r.catalogoPendiente,true);
 assert.equal(r.people[0].document,"TEST0001");
});
test("Colaboradores: falla de conexión nunca se oculta ni se muestra como padrón vacío",async()=>{
 await assert.rejects(cargarColaboradoresCompat(source({listarVigentes:()=>Promise.reject({code:"P1001"})})),e=>(e as {code?:string}).code==="P1001");
 await assert.rejects(cargarColaboradoresCompat(source({listarAreas:()=>Promise.reject({code:"P1001"})})),e=>(e as {code?:string}).code==="P1001");
});
test("Colaboradores: si tampoco existe la tabla Worker no oculta el error",async()=>{
 await assert.rejects(cargarColaboradoresCompat(source({listarVigentes:absentTable,listarBase:absentTable})),e=>(e as {code?:string}).code==="P2021");
});
test("Colaboradores: solo se degradan P2021 y P2022",()=>{
 assert.equal(errorEstructuraPrisma({code:"P2021"}),true);
 assert.equal(errorEstructuraPrisma({code:"P2022"}),true);
 assert.equal(errorEstructuraPrisma({code:"P1001"}),false);
 assert.equal(errorEstructuraPrisma(new Error("network")),false);
 assert.equal(errorEstructuraPrisma(null),false);
});
test("Colaboradores: formularios solo aparecen cuando esquema completo",()=>{
 const component=readFileSync("components/dominio/ContenidoModulo.tsx","utf8");
 assert.match(component,/!soloLectura&&<div className="grid gap-5 lg:grid-cols-2">/);
 assert.match(component,/tieneRol\(user,"ADMIN"\)&&!soloLectura&&<div/);
 assert.match(component,/cargarColaboradoresCompat\(/);
 assert.match(component,/No disponible \(migración pendiente\)/);
});
