import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarClaveAsignada,validarRestablecimientoAdmin} from "../lib/politica-contrasenas.ts";
const read=(f:string)=>readFileSync(f,"utf8");
test("Política: acepta contraseña individual de 8 o más caracteres que coincide",()=>assert.equal(validarClaveAsignada("KCJ_Clave_Muy_Segura_2026","KCJ_Clave_Muy_Segura_2026"),"KCJ_Clave_Muy_Segura_2026"));
test("Política: acepta exactamente 8 caracteres",()=>assert.equal(validarClaveAsignada("Clave123","Clave123"),"Clave123"));
test("Política: rechaza contraseña de 7 caracteres",()=>assert.throws(()=>validarClaveAsignada("Clave12","Clave12"),/8/));
test("Política: rechaza confirmación distinta",()=>assert.throws(()=>validarClaveAsignada("MiClaveLarga_123456","MiClaveLarga_123457"),/coincide/));
test("Política: rechaza longitud excesiva",()=>assert.throws(()=>validarClaveAsignada("z".repeat(257),"z".repeat(257)),/256/));
test("Política: ADMIN puede restablecer otra cuenta activa",()=>assert.doesNotThrow(()=>validarRestablecimientoAdmin("admin","otro",true)));
test("Política: reset propio requiere contraseña actual",()=>assert.throws(()=>validarRestablecimientoAdmin("admin","admin",true),/propia contraseña/));
test("Política: no permite reset de cuenta inactiva",()=>assert.throws(()=>validarRestablecimientoAdmin("admin","otro",false),/inactiva/));
test("Acceso: claves voluntarias de colaboradores y excepción segura para propietario temporal",()=>{
 const auth=read("lib/auth.ts"),actions=read("app/actions-auth.ts");
 assert.doesNotMatch(auth,/if\(user\.mustChangePassword\)redirect/);
 assert.match(actions,/redirect\("\/dashboard"\);/);
 assert.match(actions,/u.role==="PROPIETARIO"&&u.mustChangePassword/);
 assert.doesNotMatch(actions,/redirect\(u\.mustChangePassword/);
});
test("Altas y seed: contraseñas asignadas estables, no temporales",()=>{
 const op=read("app/actions-operativas.ts");
 assert.match(op,/mustChangePassword:false/);
 assert.match(read("prisma/seed.ts"),/mustChangePassword:false/);
 assert.match(read("prisma/schema.prisma"),/mustChangePassword Boolean @default\(false\)/);
 assert.match(read("prisma/migrations/20261121000600_claves_administradas_sin_cambio_obligatorio/migration.sql"),/SET DEFAULT false/);
});
test("ADMIN: reset verifica rol, audita cambio y revoca todas las sesiones",()=>{
 const op=read("app/actions-operativas.ts");
 const segment=op.split("export async function restablecerContrasena")[1].split("export async function desactivarCuenta")[0];
 assert.match(segment,/requireRole\("ADMIN"\)/);
 assert.match(segment,/validarRestablecimientoAdmin/);
 assert.match(segment,/prisma\.\$transaction/);
 assert.match(segment,/passwordHash\(nueva\)/);
 assert.match(segment,/tx\.session\.updateMany\(\{where:\{userId\}/);
 assert.match(segment,/ADMIN_REESTABLECE_CLAVE/);
 assert.doesNotMatch(segment,/password:.*payload|payload:.*password/);
});
test("ADMIN: formularios de creación y reset con confirmación",()=>{
 const ui=read("components/dominio/ContenidoModulo.tsx");
 assert.match(ui,/action=\{op\.crearCuenta\}/);
 const create=read("components/dominio/CrearCuentaForm.tsx");
 assert.match(create,/Crear cuenta especial con contraseña asignada/);
 assert.match(create,/name="confirmPassword"/);
 assert.match(create,/name="workerId"/);
 assert.match(ui,/Cambiar contraseña de un colaborador/);
 assert.match(ui,/action=\{op\.restablecerContrasena\}/);
 assert.match(ui,/confirmPassword/);
 assert.match(read("app/dashboard/layout.tsx"),/Cambiar mi contraseña/);
});

test("Restablecimiento avisa al ADMIN que la contraseña se actualizó",()=>{
 assert.match(read("app/actions-operativas.ts"),/redirect\("\/dashboard\/acceso\?clave=actualizada"\)/);
 assert.match(read("app/dashboard/[modulo]/page.tsx"),/Contraseña actualizada/);
});

test("Cambio voluntario exige clave anterior y confirma nueva clave",()=>{
 const auth=read("app/actions-auth.ts"),page=read("app/cambiar-clave/page.tsx");
 assert.match(auth,/passwordMatches\(prev,user\.passwordHash\)/);
 assert.match(auth,/next!==confirm/);
 assert.match(page,/name="confirmar"/);
});

test("Restablecer otra contraseña requiere comprobar la clave actual del ADMIN",()=>{
 const op=read("app/actions-operativas.ts");
 const segment=op.split("export async function restablecerContrasena")[1].split("export async function desactivarCuenta")[0];
 assert.match(segment,/passwordMatches\(field\(form,"adminPassword",1,256\),actor\.passwordHash\)/);
 assert.match(read("components/dominio/ContenidoModulo.tsx"),/Tu contraseña actual de ADMIN \(autorización\)/);
});
