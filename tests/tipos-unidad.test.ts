import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {TIPOS_UNIDAD_KCJ,validarTipoUnidadKCJ} from "../lib/tipos-unidad.ts";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=(file:string)=>readFileSync(path.join(root,file),"utf8");

test("El catálogo solo incluye los cuatro tipos aprobados por KCJ",()=>{
  assert.deepEqual(TIPOS_UNIDAD_KCJ.map(x=>x.label),["Camioneta","Microbús","Minibús","Ómnibus"]);
  assert.deepEqual(TIPOS_UNIDAD_KCJ.map(x=>x.value),["CAMIONETA","MICROBUS","MINIBUS","OMNIBUS"]);
});

test("El servidor acepta solo los cuatro valores autorizados",()=>{
  for(const {value} of TIPOS_UNIDAD_KCJ)assert.equal(validarTipoUnidadKCJ(value),value);
  for(const bad of ["BUS","Bus","CAMION","OTRO","MICROBUS_EXT", "", "CAMIONETA ",null,undefined,4]){
    assert.throws(()=>validarTipoUnidadKCJ(bad),/Tipo de unidad no válido/);
  }
});

test("El alta muestra selector obligatorio y comparte el catálogo con el servidor",()=>{
  const view=source("components/dominio/ContenidoModulo.tsx");
  const action=source("app/actions-operativas.ts");
  assert.match(view,/field\("type","Tipo de unidad","select",true,TIPOS_UNIDAD_KCJ\.map/);
  assert.match(action,/type:validarTipoUnidadKCJ\(field\(form,"type",3,50\)\)/);
});

test("Se conservan los tipos históricos sin migración destructiva",()=>{
  assert.match(source("prisma/schema.prisma"),/model Vehicle\s*\{[\s\S]*?type String/);
});
