import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const route="app/dashboard/ficha-colaborador/[id]/page.tsx";
const code=readFileSync(route,"utf8");
const listado=readFileSync("components/dominio/ContenidoModulo.tsx","utf8");

test("Toda ficha del padrón abre una ruta dinámica existente",()=>{
 assert.equal(existsSync(route),true);
 assert.match(listado,/href=\{`\/dashboard\/ficha-colaborador\/\$\{x\.id\}`\}/);
 assert.match(code,/export default async function FichaColaborador/);
 assert.match(code,/const \{id\}=await params/);
});
test("Ficha consulta al trabajador existente, no lo crea ni duplica",()=>{
 assert.match(code,/prisma\.worker\.findUnique\(\{where:\{id\}/);
 assert.doesNotMatch(code,/prisma\.worker\.(create|upsert|update|delete)\(/);
});
test("Ficha comprueba autenticación, panel y permiso en el servidor",()=>{
 assert.match(code,/requireUser\(\)/);
 assert.match(code,/panelActual\(user\)/);
 assert.match(code,/canAccess\(rolesParaPanel\(user,panel\),"personal"\)/);
 assert.match(code,/if\(!colaborador\)notFound\(\)/);
});
test("No expone contraseñas ni contenido médico",()=>{
 assert.doesNotMatch(code,/passwordHash|diagnostico|historiaClinica|medicalFitness\.find/);
 assert.match(code,/permisos\.includes\("ADMIN"\)/);
 assert.match(code,/verHomologacion\?prisma\.clearance/);
 assert.match(code,/verRoster\?prisma\.roster/);
});
test("Ficha soporta lectura compatible si falta segunda área",()=>{
 assert.match(code,/errorEstructuraPrisma/);
 assert.match(code,/segundaAreaPendiente=true/);
});
