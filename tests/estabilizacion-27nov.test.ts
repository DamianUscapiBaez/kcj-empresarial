import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {rolesParaPanel} from "../lib/paneles-kcj.ts";
import {autorizarOperacionServicio} from "../lib/validaciones-prepiloto.ts";
import {MIGRACIONES_KCJ} from "../lib/esquema-requerido-kcj.ts";
const read=(p:string)=>readFileSync(new URL(`../${p}`,import.meta.url),"utf8");
const part=(name:string)=>read("app/actions-operativas.ts").split(`export async function ${name}(`)[1].split("export async function ")[0];
test("Cuenta dual: RRHH no inicia ni finaliza servicios desde su panel aunque tenga Operaciones",()=>{
 const cuenta={role:"RRHH" as const,grants:[{role:"OPERACIONES" as const}]};
 const puede=(panel:"area:RRHH"|"area:OPERACIONES")=>rolesParaPanel(cuenta,panel).some(r=>r==="OPERACIONES"||r==="JEFE_OPERACIONES");
 assert.throws(()=>autorizarOperacionServicio("area:RRHH","a","b",puede("area:RRHH")));
 assert.doesNotThrow(()=>autorizarOperacionServicio("area:OPERACIONES","a","b",puede("area:OPERACIONES")));
 for(const name of ["iniciarServicio","finalizarServicio"])assert.match(part(name),/rolesParaPanel\(u,panel\)/);
});
test("Diagnóstico enumera exactamente las migraciones del paquete",()=>{
 const folders=readdirSync(new URL("../prisma/migrations/",import.meta.url),{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name).sort();
 assert.deepEqual([...MIGRACIONES_KCJ],folders);
});
test("Propietario temporal no accede a APIs ni acciones; cambiar clave conserva acceso específico",()=>{
 const auth=read("lib/auth.ts");assert.match(auth,/currentUser\(allowPasswordChange=false\)/);
 assert.match(auth,/!allowPasswordChange&&session\.user\.role==="PROPIETARIO"&&session\.user\.mustChangePassword\)return null/);
 assert.match(auth,/user\.role==="PROPIETARIO"&&user\.mustChangePassword\)redirect\("\/cambiar-clave"\)/);
 assert.match(read("app/cambiar-clave/page.tsx"),/await requirePasswordChangeUser\(\)/);
 assert.match(read("app/actions-auth.ts"),/currentUser\(true\)/);
});
test("SSOMA serializa agregar, verificar, cerrar y reabrir; mantiene autoría previa",()=>{
 for(const n of ["agregarAccion","verificarAccion","cerrarCaso","reabrirCaso"]){assert.match(part(n),/prisma\.\$transaction/);assert.match(part(n),/TransactionIsolationLevel\.Serializable/);assert.match(part(n),/tx\.auditLog\.create/);}
 assert.match(part("reabrirCaso"),/previousClosedBy:c\.closedBy/);
});
test("Aptitud: la actualización preserva estado anterior y auditoría dentro de la transacción",()=>{
 const s=part("registrarAptitud");assert.match(s,/tx\.medicalFitness\.findUnique/);assert.match(s,/previous:previous\?/);assert.match(s,/tx\.medicalFitness\.upsert/);assert.match(s,/tx\.auditLog\.create/);assert.match(s,/TransactionIsolationLevel\.Serializable/);
});
test("Odómetro: lectura, validación, escritura y auditoría en una transacción serializable",()=>{
 const s=part("registrarOdometro");assert.match(s,/tx\.odometerReading\.findFirst/);assert.match(s,/kilometers<last\.kilometers/);assert.match(s,/tx\.odometerReading\.create/);assert.match(s,/tx\.auditLog\.create/);assert.match(s,/TransactionIsolationLevel\.Serializable/);
});
test("Adjuntos nuevos de expedientes comprueban el actor que los subió",()=>{
 for(const n of ["registrarDocumento","registrarOdometro","registrarHomologacionPersonal","registrarContrato"])assert.match(part(n),/requireEvidenceOwnedAny\(/);
});
test("Cambio voluntario no sobrescribe una contraseña restablecida simultáneamente",()=>{
 assert.match(read("app/actions-auth.ts"),/updateMany\(\{where:\{id:user\.id,active:true,passwordHash:user\.passwordHash\}/);
});

test("Inicio y cambio de unidad bloquean otro servicio que permanece EN_CURSO, sin depender del horario planificado",()=>{
 for(const n of ["iniciarServicio","cambiarUnidad"]){const s=part(n);assert.match(s,/otroEnCurso=await tx\.service\.findFirst/);assert.match(s,/status:"EN_CURSO",OR:/);assert.match(s,/if\(otroEnCurso\)throw/);}
});
test("Inspección usa el área elegida y revalida la asignación dentro de la transacción",()=>{
 const s=read("app/actions-aula.ts").split("export async function registrarInspeccion(")[1].split("export async function ")[0];assert.match(s,/const roles=await rolesSesion\(u\)/);assert.match(s,/roles\.includes\("CONDUCTOR"\)/);assert.match(s,/const current=await tx\.service\.findUnique/);assert.match(s,/current\.vehicleId!==vehicleId/);
});
test("Health permite identificar la versión y commit del despliegue sin mostrar datos privados",()=>{
 const health=read("app/api/health/route.ts");assert.match(health,/version:pkg.version,commit:process.env.VERCEL_GIT_COMMIT_SHA/);assert.match(health,/\.\.\.release,status:"ok"/);assert.match(health,/\.\.\.release,status:"error"/);
});
