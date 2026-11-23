import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MIN_LONGITUD_CLAVE,MAX_LONGITUD_CLAVE,validarClaveAsignada} from "../lib/politica-contrasenas.ts";
const read=(path:string)=>readFileSync(path,"utf8");
test("Política central: mínimo ocho y máximo 256 caracteres",()=>{
 assert.equal(MIN_LONGITUD_CLAVE,8);assert.equal(MAX_LONGITUD_CLAVE,256);
 assert.equal(validarClaveAsignada("Clave123","Clave123"),"Clave123");
 assert.throws(()=>validarClaveAsignada("Clave12","Clave12"),/8/);
 assert.throws(()=>validarClaveAsignada("a".repeat(257),"a".repeat(257)),/256/);
});
test("Alta administrativa y reset usan mínimo centralizado en servidor",()=>{
 const s=read("app/actions-operativas.ts");
 assert.equal((s.match(/field\(form,"password",MIN_LONGITUD_CLAVE,MAX_LONGITUD_CLAVE\)/g)??[]).length,2);
 assert.equal((s.match(/field\(form,"confirmPassword",MIN_LONGITUD_CLAVE,MAX_LONGITUD_CLAVE\)/g)??[]).length,2);
});
test("Cambio de clave y creación de administrador usan mínimo centralizado",()=>{
 assert.match(read("app/actions-auth.ts"),/next.length<MIN_LONGITUD_CLAVE/);
 assert.match(read("prisma/seed.ts"),/password.length < MIN_LONGITUD_CLAVE/);
});
test("Formularios de administración y cambio personal admiten 8",()=>{
 assert.match(read("components/dominio/CrearCuentaForm.tsx"),/minLength=\{8\}/);
 assert.match(read("components/dominio/AdminEditarCuentaForm.tsx"),/required minLength=\{8\}/);
 assert.match(read("app/cambiar-clave/page.tsx"),/minLength=\{8\}/);
 assert.match(read("components/ui/fields.tsx"),/f.name!=="adminPassword"\?8:undefined/);
 assert.doesNotMatch(read("components/dominio/ContenidoModulo.tsx"),/mín\. 16 caracteres/);
});
test("Altas de colaboradores conservan DNI y propietarios mantienen claves temporales seguras",()=>{
 assert.match(read("app/actions-operativas.ts"),/passwordHash\(dni\)/);
 assert.match(read("app/actions-propietarios.ts"),/randomBytes\(24\)\.toString\("base64url"\)/);
 assert.match(read("app/actions-propietarios.ts"),/mustChangePassword:true/);
});
