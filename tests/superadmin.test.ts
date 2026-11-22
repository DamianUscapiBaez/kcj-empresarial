import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {esRolKCJ,validarCambioRolPrincipal,validarBajaAdministrativa,validarVinculosRol,validacionReactivacion,motivoAdmin} from "../lib/superadmin-policy.ts";
const read=(p:string)=>readFileSync(p,"utf8");
test("ADMIN: solo roles reales y ninguna autorización técnica inventada",()=>{
 assert.equal(esRolKCJ("ADMIN"),true);
 assert.equal(esRolKCJ("TECNICO_TI"),false);
 assert.equal(esRolKCJ("SUPERADMIN_BYPASS"),false);
});
test("ADMIN: prohíbe cambio de rol propio y último administrador",()=>{
 assert.throws(()=>validarCambioRolPrincipal("a","a","ADMIN","RRHH",2),/propia/);
 assert.throws(()=>validarCambioRolPrincipal("a","b","ADMIN","RRHH",1),/una cuenta ADMIN/);
 assert.equal(validarCambioRolPrincipal("a","b","RRHH","OPERACIONES",1),"OPERACIONES");
 assert.throws(()=>validarCambioRolPrincipal("a","b","RRHH","XYZ",1),/no reconocida/);
});
test("ADMIN: la baja lógica no elimina la última cuenta ADMIN ni la propia",()=>{
 assert.throws(()=>validarBajaAdministrativa("a","a","ADMIN",4),/propia/);
 assert.throws(()=>validarBajaAdministrativa("a","b","ADMIN",1),/último ADMIN/);
 assert.doesNotThrow(()=>validarBajaAdministrativa("a","b","ADMIN",2));
});
test("ADMIN: respeta la relación única de conductores y propietarios",()=>{
 assert.throws(()=>validarVinculosRol("CONDUCTOR",null,null),/ficha de trabajador/);
 assert.throws(()=>validarVinculosRol("PROPIETARIO",null,null),/propietario vinculado/);
 assert.doesNotThrow(()=>validarVinculosRol("CONDUCTOR","trabajador-1",null));
});
test("ADMIN: no reactiva un usuario si la ficha laboral sigue inactiva",()=>{
 assert.throws(()=>validacionReactivacion(true,false,false),/inactiva/);
 assert.throws(()=>validacionReactivacion(false,false,true),/ya está activa/);
 assert.doesNotThrow(()=>validacionReactivacion(true,true,false));
});
test("ADMIN: exige motivo auditable",()=>{
 assert.throws(()=>motivoAdmin("sin dato"),/10 a 500/);
 assert.equal(motivoAdmin("  Cambio aprobado por jefatura  "),"Cambio aprobado por jefatura");
});
test("Acciones ADMIN: todas verifican identidad y dejan trazabilidad",()=>{
 const src=read("app/actions-operativas.ts");
 for(const [name,event] of [["editarCuentaAdmin","ADMIN_EDITAR_CUENTA"],["cambiarRolPrincipalAdmin","ADMIN_CAMBIO_ROL_PRINCIPAL"],["desactivarCuenta","ADMIN_DESACTIVAR_CUENTA"],["reactivarCuentaAdmin","ADMIN_REACTIVAR_CUENTA"]]){
  const text=src.split(`export async function ${name}`)[1].split("export async function ")[0];
  assert.ok(text,`Acción ${name} no encontrada`);
  assert.match(text,/requireRole\("ADMIN"\)/);
  assert.match(text,/passwordMatches\(field\(form,"adminPassword"/);
  assert.match(text,/motivoAdmin\(/);
  assert.match(text,/isolationLevel:"Serializable"/);
  assert.match(text,/tx\.auditLog\.create/);
  assert.match(text,new RegExp(event));
  assert.doesNotMatch(text,/deleteMany\(|\.delete\(/);
 }
});
test("Cambio de rol y desactivación revocan sesiones anteriores",()=>{
 const src=read("app/actions-operativas.ts");
 for(const name of ["cambiarRolPrincipalAdmin","desactivarCuenta","reactivarCuentaAdmin"]){
  const segment=src.split(`export async function ${name}`)[1].split("export async function ")[0];
  assert.match(segment,/tx\.session\.updateMany/);
 }
});
test("UI de ADMIN: editar, cambiar función, desactivar y reactivar",()=>{
 const ui=read("components/dominio/ContenidoModulo.tsx");
 for(const name of ["editarCuentaAdmin","cambiarRolPrincipalAdmin","desactivarCuenta","reactivarCuentaAdmin"]){
  assert.match(ui,new RegExp(`action=\\{op\\.${name}\\}`));
 }
 assert.match(ui,/baja lógica auditada/);
 assert.match(ui,/Tu cuenta · protegida/);
});
test("Se mantienen las aprobaciones de área: salud, mantenimiento y SSOMA",()=>{
 const src=read("app/actions-operativas.ts");
 assert.match(src,/export async function liberarMantenimiento\(form:FormData\)\{const u=await requireRole\("MANTENIMIENTO"\)/);
 assert.match(src,/export async function registrarAptitud\(form:FormData\)\{const u=await requireRole\("SALUD"\)/);
 assert.match(src,/export async function cerrarCaso\(form:FormData\)\{const u=await requireRole\("SSOMA"\)/);
 assert.match(src,/export async function validarTareo\(form:FormData\)\{const u=await requireRole\("RRHH"\)/);
});
