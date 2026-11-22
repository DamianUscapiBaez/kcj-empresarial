import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(file:string)=>readFileSync(new URL(`../${file}`,import.meta.url),"utf8");

test("20 módulos, incluidos dos simulacros, tienen implementación y menú",()=>{
 const catalog=read("lib/modulos.ts"),ui=read("components/dominio/ContenidoModulo.tsx"),nav=read("lib/navegacion-kcj.ts");
 const slugs=[...catalog.matchAll(/\{slug:"([a-z-]+)",title:/g)].map(m=>m[1]);
 assert.equal(slugs.length,20);
 assert.equal(new Set(slugs).size,20);
 for(const slug of slugs){
  assert.ok(ui.includes(`case "${slug}":`),`Falta contenido de ${slug}`);
  assert.ok(nav.includes(`"${slug}"`),`Falta enlace de ${slug}`);
 }
});

test("Aula Virtual tiene orientación visible aun sin cursos",()=>{
 const ui=read("components/dominio/ContenidoModulo.tsx");
 assert.match(ui,/courses\.length===0&&<Note>/);
 assert.match(ui,/No tienes cursos publicados disponibles/);
});

test("El registro de usuario requiere vínculo de conductor, contraseña confirmada y rechaza cuentas duplicadas",()=>{
 const ui=read("components/dominio/CrearCuentaForm.tsx"),action=read("app/actions-operativas.ts");
 assert.match(ui,/needWorker=role==="CONDUCTOR"/);
 assert.match(ui,/name="workerId"/);
 assert.match(ui,/required=\{needWorker\}/);
 assert.match(ui,/password!==confirm/);
 assert.match(action,/El colaborador ya tiene una cuenta/);
 assert.match(action,/tx\.worker\.findUnique/);
 assert.match(action,/tx\.auditLog\.create/);
 assert.match(action,/await prisma\.\$transaction\(async tx=>/);
});

test("Acceso y sesión rechazan un trabajador inactivo",()=>{
 assert.match(read("app/actions-auth.ts"),/u\.workerId&&!u\.worker\?\.active/);
 assert.match(read("lib/auth.ts"),/session\.user\.workerId&&!session\.user\.worker\?\.active/);
});
