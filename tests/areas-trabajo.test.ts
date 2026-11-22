import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarAreasTrabajo,nombreNuevaArea,AREAS_INICIALES_KCJ} from "../lib/areas-trabajo.ts";
const root=new URL("../",import.meta.url);
const read=(name:string)=>readFileSync(new URL(name,root),"utf8");
test("Una sola área principal y secundaria opcional",()=>{
 assert.deepEqual(validarAreasTrabajo("Operaciones","",AREAS_INICIALES_KCJ),{area:"Operaciones",secondaryArea:null});
 assert.deepEqual(validarAreasTrabajo("Operaciones","SSOMA",AREAS_INICIALES_KCJ),{area:"Operaciones",secondaryArea:"SSOMA"});
});
test("No se aceptan áreas repetidas ni inventadas",()=>{
 assert.throws(()=>validarAreasTrabajo("Operaciones","Operaciones",AREAS_INICIALES_KCJ),/distintas/);
 assert.throws(()=>validarAreasTrabajo("Homologación",null,AREAS_INICIALES_KCJ),/catálogo/);
 assert.throws(()=>validarAreasTrabajo("Operaciones","Flota",AREAS_INICIALES_KCJ),/catálogo/);
});
test("Centro de Control puede agregar áreas válidas",()=>{
 assert.equal(nombreNuevaArea("  Apoyo  operativo  "),"Apoyo operativo");
 assert.throws(()=>nombreNuevaArea("<>"),/entre 3 y 100|no válido/);
});
test("Migración aditiva mantiene área histórica y agrega segunda",()=>{
 const sql=read("prisma/migrations/20261121000700_areas_principal_segunda/migration.sql");
 assert.match(sql,/ADD COLUMN "secondaryArea"/);
 assert.match(sql,/CREATE TABLE "WorkArea"/);
 assert.doesNotMatch(sql,/DROP TABLE|DELETE FROM "Worker"|UPDATE "Worker"/);
});
test("Formulario de colaborador usa dos áreas, no exige cargo",()=>{
 const s=read("components/dominio/FormulariosColaborador.tsx");
 assert.match(s,/Primera área de trabajo/);
 assert.match(s,/Segunda área de trabajo/);
 assert.doesNotMatch(s,/name="job"/);
 assert.match(read("components/dominio/ContenidoModulo.tsx"),/Padrón de colaboradores/);
});
test("No se alteran los roles al cambiar áreas",()=>{
 const s=read("app/actions-operativas.ts");
 const start=s.indexOf("export async function actualizarTrabajador");
 const end=s.indexOf("export async function",start+20);
 const scope=s.slice(start,end<0?undefined:end);
 assert.doesNotMatch(scope,/tx\.user\.update\(\{where:\{id:acc\.id\},data:\{role:/);
 assert.match(scope,/ACTUALIZAR_AREAS_ESTADO/);
});

test("Tareo: se elige solo entre áreas autorizadas y se guarda la del trabajo efectivo",()=>{
 const component=read("components/dominio/TareoRegistroForm.tsx");
 const actions=read("app/actions-operativas.ts");
 assert.match(component,/persona\.secondaryArea/);
 assert.match(actions,/areaAtEntry!==worker\.area&&areaAtEntry!==worker\.secondaryArea/);
 assert.match(actions,/areaAtEntry,reason/);
});
