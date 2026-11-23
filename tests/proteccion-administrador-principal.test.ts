import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {bloquearCambioCuentaPrincipal,esCuentaPrincipal} from "../lib/administrador-principal.ts";
const actions=readFileSync("app/actions-operativas.ts","utf8");
test("ADMIN principal: cuenta marcada impide mutaciones, incluso intentos de otro ADMIN",()=>{
 assert.throws(()=>bloquearCambioCuentaPrincipal("cuenta-titular","cuenta-titular"),/está protegida/);
 assert.doesNotThrow(()=>bloquearCambioCuentaPrincipal("cuenta-titular","otra-cuenta"));
 assert.doesNotThrow(()=>bloquearCambioCuentaPrincipal(null,"otra-cuenta"));
 assert.equal(esCuentaPrincipal("cuenta-titular","cuenta-titular"),true);
});
test("ADMIN principal: todas las acciones de modificación administrativa consultan protección dentro de transacción",()=>{
 for(const fn of ["restablecerContrasena","editarCuentaAdmin","cambiarRolPrincipalAdmin","desactivarCuenta","reactivarCuentaAdmin","actualizarTrabajador","otorgarRol","revocarRol"]){
  const chunk=actions.split(`export async function ${fn}`)[1]?.split("export async function ")[0];
  assert.ok(chunk,`Falta ${fn}`);
  assert.match(chunk,/exigirNoProtegida\(tx,/);
 }
});
test("ADMIN principal: alta requiere confirmación doble y no permite reasignación silenciosa",()=>{
 const src=readFileSync("scripts/proteger-administrador-principal.mjs","utf8");
 assert.match(src,/KCJ_PRIMARY_ADMIN_USER_ID/);
 assert.match(src,/KCJ_PRIMARY_ADMIN_LOGIN/);
 assert.match(src,/SI_CONFIRMADO_POR_TITULAR/);
 assert.match(src,/current\.userId!==id/);
 assert.match(src,/isolationLevel:Prisma.TransactionIsolationLevel.Serializable/);
});
test("ADMIN principal: tabla singleton independiente y borrado restringido",()=>{
 const sql=readFileSync("prisma/migrations/20261121001600_administrador_principal_protegido/migration.sql","utf8");
 assert.match(sql,/CHECK \("id" = 'PRIMARY'\)/);
 assert.match(sql,/ON DELETE RESTRICT/);
 assert.match(sql,/CREATE UNIQUE INDEX/);
});
