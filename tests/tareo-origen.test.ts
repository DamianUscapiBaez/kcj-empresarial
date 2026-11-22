import test from "node:test";
import assert from "node:assert/strict";
import {validarOrigenTareo,validarVinculoServicioTareo,motivoRegistroInterno} from "../lib/tareo-kcj.ts";

const start = new Date("2026-11-21T06:00:00-05:00");
const end = new Date("2026-11-21T18:00:00-05:00");
const service={workerId:"w1",status:"FINALIZADO",startsAt:start,endsAt:end,startedAt:start,endedAt:end};
test("Tareo solo acepta fuentes controladas",()=>{
 assert.equal(validarOrigenTareo("SERVICIO"),"SERVICIO");
 assert.equal(validarOrigenTareo("REGISTRO_INTERNO"),"REGISTRO_INTERNO");
 assert.throws(()=>validarOrigenTareo("OPERACIONES"),/Origen/);
 assert.throws(()=>validarOrigenTareo("ROSTER"),/Origen/);
});
test("Registro interno exige justificación verificable",()=>{
 assert.equal(motivoRegistroInterno("Capacitación interna verificada"),"Capacitación interna verificada");
 assert.throws(()=>motivoRegistroInterno(""),/justificación/);
 assert.throws(()=>motivoRegistroInterno("corto"),/justificación/);
});
test("Servicio concluido y asignado al trabajador respalda el tareo",()=>{
 assert.doesNotThrow(()=>validarVinculoServicioTareo({workerId:"w1",servicio:service,startsAt:start,endsAt:end}));
});
test("Tareo no se atribuye al servicio de otro conductor",()=>{
 assert.throws(()=>validarVinculoServicioTareo({workerId:"w2",servicio:service,startsAt:start,endsAt:end}),/no está asignado/);
});
test("ROSTER o servicio solo planificado no son horas efectivas",()=>{
 assert.throws(()=>validarVinculoServicioTareo({workerId:"w1",servicio:{...service,status:"PLANIFICADO"},startsAt:start,endsAt:end}),/servicio iniciado/);
});
test("No admite tareo fuera de ventana del servicio",()=>{
 assert.throws(()=>validarVinculoServicioTareo({workerId:"w1",servicio:service,startsAt:new Date("2026-11-22T06:00:00-05:00"),endsAt:new Date("2026-11-22T08:00:00-05:00")}),/no coinciden/);
});

test("Formulario separa área automática de origen, no envía campo manual source", async()=>{
 const fs=await import("node:fs");
 const path=await import("node:path");
 const src=fs.readFileSync(path.join(process.cwd(),"components/dominio/TareoRegistroForm.tsx"),"utf8");
 const action=fs.readFileSync(path.join(process.cwd(),"app/actions-operativas.ts"),"utf8");
 assert.match(src,/Área donde realizó el trabajo/);
 assert.match(src,/name="areaAtEntry"/);
 assert.match(src,/name="origin"/);
 assert.doesNotMatch(src,/name="source"/);
 assert.match(action,/await tx\.worker\.findUnique/);
 assert.match(action,/isolationLevel:"Serializable"/);
 assert.match(action,/validarVinculoServicioTareo/);
});


test("Área se guarda como fotografía histórica sin modificar registros anteriores", async()=>{
 const fs=await import("node:fs");
 const path=await import("node:path");
 const action=fs.readFileSync(path.join(process.cwd(),"app/actions-operativas.ts"),"utf8");
 const schema=fs.readFileSync(path.join(process.cwd(),"prisma/schema.prisma"),"utf8");
 const migration=fs.readFileSync(path.join(process.cwd(),"prisma/migrations/20261121000500_tareo_area_origen_controlado/migration.sql"),"utf8");
 const view=fs.readFileSync(path.join(process.cwd(),"components/dominio/ContenidoModulo.tsx"),"utf8");
 assert.match(action,/areaAtEntry,reason/);
 assert.match(action,/requireRole\("OPERACIONES","JEFE_OPERACIONES","ADMIN"\)/);
 assert.match(schema,/areaAtEntry String\?/);
 assert.match(migration,/ALTER TABLE "Timesheet" ADD COLUMN "areaAtEntry" TEXT/);
 assert.doesNotMatch(migration,/DROP TABLE|DELETE FROM|TRUNCATE/i);
 assert.match(view,/x.areaAtEntry\?\?x.worker.area/);
});
