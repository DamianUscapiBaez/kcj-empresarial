import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {loginPropietario,permitirVinculacion,propietarioPuedeVerUnidad,descripcionEstadoDocumento} from "../lib/propietarios-kcj.ts";
import {canAccess} from "../lib/modulos.ts";
const read=(path:string)=>readFileSync(path,"utf8");

test("Propietario: usuario se deriva del documento sin exponer DNI de trabajador",()=>{
 assert.equal(loginPropietario(" 20583648581 "),"prop-20583648581");
 assert.throws(()=>loginPropietario(""),/inválido/);
 assert.throws(()=>loginPropietario("abcd"),/inválido/);
});
test("Propietario: aislamiento por identidad, no por placa",()=>{
 assert.equal(propietarioPuedeVerUnidad("dueño-A","dueño-A"),true);
 assert.equal(propietarioPuedeVerUnidad("dueño-A","dueño-B"),false);
 assert.equal(propietarioPuedeVerUnidad(null,null),false);
});
test("Vínculos: impide sobrescribir un dueño existente",()=>{
 assert.doesNotThrow(()=>permitirVinculacion(null,"a"));
 assert.throws(()=>permitirVinculacion("a","b"),/ya está vinculada/);
 assert.throws(()=>permitirVinculacion("a","a"),/ya pertenece/);
});
test("Vencimientos: no inventa fecha cuando no existe",()=>{
 const ahora=new Date("2026-11-22T00:00:00.000Z");
 assert.equal(descripcionEstadoDocumento(null,ahora),"Sin vencimiento registrado");
 assert.equal(descripcionEstadoDocumento(new Date("2026-11-20T00:00:00.000Z"),ahora),"Vencido");
 assert.equal(descripcionEstadoDocumento(new Date("2026-12-01T00:00:00.000Z"),ahora),"Por vencer");
 assert.equal(descripcionEstadoDocumento(new Date("2027-02-01T00:00:00.000Z"),ahora),"Vigente");
});
test("RBAC: propietario no accede a RRHH, SSOMA, informes internos ni cuentas",()=>{
 for(const slug of ["acceso","personal","rrhh","ssoma","reportes","homologacion","mantenimiento","operaciones"] as const){assert.equal(canAccess("PROPIETARIO",slug),false);}
 assert.equal(canAccess("PROPIETARIO","propietarios"),true);
 assert.equal(canAccess("PROPIETARIO","flota"),true);
});
test("Alta: cuenta propietaria requiere ADMIN, clave aleatoria, hash, cambio inicial y auditoría",()=>{
 const action=read("app/actions-propietarios.ts");
 assert.match(action,/requireRole\("ADMIN"\)/);
 assert.match(action,/randomBytes\(24\)/);
 assert.match(action,/passwordHash\(temporal\)/);
 assert.match(action,/mustChangePassword:true/);
 assert.match(action,/vinculadas\.length/);
 assert.match(action,/CREAR_ACCESO_PROPIETARIO/);
 assert.doesNotMatch(action,/payload:\{[^}]*temporal/);
});
test("Restablecimiento: revoca sesiones y no devuelve contraseña histórica",()=>{
 const code=read("app/actions-propietarios.ts");
 assert.match(code,/session\.updateMany/);
 assert.match(code,/RESTABLECER_ACCESO_PROPIETARIO/);
 assert.match(code,/owner\.update/);
 assert.match(code,/TransactionIsolationLevel\.Serializable/);
});
test("Operaciones: vínculo y desvínculo de vehículo auditable, sin crear vehículos duplicados",()=>{
 const code=read("app/actions-operativas.ts");
 const section=code.split("export async function vincularUnidadPropietario")[1].split("export async function crearVehiculo")[0];
 assert.match(section,/ownerId:null/);
 assert.match(section,/permitirVinculacion/);
 assert.match(section,/VINCULAR_PROPIETARIO/);
 assert.match(section,/DESVINCULAR_PROPIETARIO/);
 assert.doesNotMatch(section,/vehicle\.create/);
});
test("Vista de dueño: filtrado en consulta SQL y separación de expediente privado",()=>{
 const ficha=read("app/dashboard/ficha-vehicular/[id]/page.tsx");
 const ownerPart=ficha.split("if(isOwner){")[1].split("const vehicle=await prisma.vehicle.findUnique")[0];
 assert.match(ownerPart,/findFirst\(\{where:\{id,ownerId:user.ownerId\}/);
 assert.doesNotMatch(ownerPart,/custody:|senderName:|receiverName:|worker:|services:|recordedBy:|performedBy:|VIN \/ serie/);
 const content=read("components/dominio/ContenidoModulo.tsx");
 assert.match(content,/GestionPropietarios/);
 assert.match(content,/where:\{ownerId:user.ownerId/);
});
test("Primera entrada: solo propietario con temporal cambia contraseña, colaborador conserva su regla",()=>{
 const login=read("app/actions-auth.ts");
 const layout=read("app/dashboard/layout.tsx");
 assert.match(login,/u.role==="PROPIETARIO"&&u.mustChangePassword/);
 assert.match(layout,/user.role==="PROPIETARIO"&&user.mustChangePassword/);
 assert.match(read("app/cambiar-clave/page.tsx"),/debes reemplazar la clave temporal/);
});
