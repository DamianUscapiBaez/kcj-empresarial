import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {trabajadorMinimoSesion} from "../lib/auth-select.ts";
import {diagnosticarErrorColaboradores} from "../lib/colaboradores-errores.ts";

test("sesión selecciona exclusivamente identidad mínima, sin nueva columna",()=>{
 assert.deepEqual(Object.keys(trabajadorMinimoSesion).sort(),["active","id","name"]);
 assert.equal("secondaryArea" in trabajadorMinimoSesion,false);
 const auth=readFileSync("lib/auth.ts","utf8");
 assert.match(auth,/worker:\{select:trabajadorMinimoSesion\}/);
 assert.doesNotMatch(auth,/worker:\s*true/);
});
test("la carga de sesión y las pausas conservan el nombre del trabajador",()=>{
 assert.equal(trabajadorMinimoSesion.name,true);
 const source=readFileSync("app/actions-pausas.ts","utf8");
 assert.match(source,/user\.worker!\.name/);
});
test("el error SQL de columna faltante no se comunica como lista vacía",()=>{
 const info=diagnosticarErrorColaboradores({code:"P2022",message:"contraseña y SQL no deben ser visibles"});
 assert.equal(info.tipo,"estructura");
 assert.equal(info.codigo,"P2022");
 assert.doesNotMatch(info.mensaje,/contraseña/);
});
test("las interrupciones y privilegios se diferencian de errores de esquema",()=>{
 assert.equal(diagnosticarErrorColaboradores({code:"P1001"}).tipo,"conexion");
 assert.equal(diagnosticarErrorColaboradores({code:"P1010"}).tipo,"acceso");
 assert.equal(diagnosticarErrorColaboradores(new Error("cadena secreta")).tipo,"desconocido");
});
test("Colaboradores captura fallos de lectura sin habilitar formularios",()=>{
 const component=readFileSync("components/dominio/ContenidoModulo.tsx","utf8");
 assert.match(component,/try \{\s*resultado=await cargarColaboradoresCompat/);
 assert.match(component,/catch\(error:unknown\)/);
 assert.match(component,/consulta temporalmente no disponible/);
 assert.match(component,/!soloLectura&&<div className="grid/);
 assert.match(component,/no mostrará registros incompletos ni habilitará altas/);
});
