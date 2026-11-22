import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {UNIDADES_MEDIDA_KCJ,validarUnidadMedidaKCJ} from "../lib/unidades-medida.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source = (relative:string) => readFileSync(path.join(root,relative),"utf8");

test("Nueve unidades de medida estandarizadas para KCJ",()=>{
  assert.deepEqual(UNIDADES_MEDIDA_KCJ.map(({value})=>value),[
    "UND","PAR","JGO","L","KG","M","CJA","PQT","ROL"
  ]);
  assert.deepEqual(UNIDADES_MEDIDA_KCJ.map(({label})=>label),[
    "Unidad (UND)","Par (PAR)","Juego (JGO)","Litro (L)","Kilogramo (KG)",
    "Metro (M)","Caja (CJA)","Paquete (PQT)","Rollo (ROL)"
  ]);
});

test("El servidor acepta únicamente códigos del catálogo, no texto arbitrario",()=>{
  for(const item of UNIDADES_MEDIDA_KCJ)assert.equal(validarUnidadMedidaKCJ(item.value),item.value);
  for(const bad of ["Unidad","UNIDAD","und","UND ","BOLSA","OTRO",""," ",null,undefined,2]){
    assert.throws(()=>validarUnidadMedidaKCJ(bad),/Unidad de medida no válida/);
  }
});

test("Pantalla y acción del inventario comparten el catálogo oficial",()=>{
  const ui=source("components/dominio/ContenidoModulo.tsx");
  const actions=source("app/actions-operativas.ts");
  assert.match(ui,/field\("unit","Unidad de medida","select",true,UNIDADES_MEDIDA_KCJ\.map/);
  assert.match(actions,/unit:validarUnidadMedidaKCJ\(field\(form,"unit",1,30\)\)/);
});

test("No se cambian las unidades guardadas ni se crea migración destructiva",()=>{
  const prisma=source("prisma/schema.prisma");
  assert.match(prisma,/model InventoryItem\s*\{[\s\S]*?unit\s+String/);
});
