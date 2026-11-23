import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarLicenciaColaborador,validarContactoCelular} from "../lib/licencia-colaborador.ts";
import {overlaps} from "../lib/dominio-kcj.ts";
import {panelesDisponibles,rolesParaPanel,puedeSeleccionarPanel,nombrePanel} from "../lib/paneles-kcj.ts";
const file=(name:string)=>readFileSync(name,"utf8");
test("El celular es opcional y se consulta sin disparar una llamada",()=>{
 assert.equal(validarContactoCelular(null),null);
 assert.equal(validarContactoCelular("987 654 321"),"987 654 321");
 assert.throws(()=>validarContactoCelular("abc"));
 const ficha=file("app/dashboard/ficha-colaborador/[id]/page.tsx");
 assert.match(ficha,/Solo consulta del número/);
 assert.doesNotMatch(ficha,/(href="tel:|wa\.me)/);
});
test("Licencia particular A-I puede registrarse sin convertir al usuario en conductor",()=>{
 const expiracion=new Date("2029-11-23T12:00:00.000Z");
 assert.doesNotThrow(()=>validarLicenciaColaborador("Q12345678","A-I",expiracion,null));
 assert.doesNotThrow(()=>validarLicenciaColaborador(null,null,null,null));
 assert.match(file("components/dominio/FormulariosColaborador.tsx"),/opcional para todos/);
});
test("Al registrar licencia exige categoría y vencimiento, pero no exige licencia si no tiene",()=>{
 const vence=new Date("2029-11-23T12:00:00.000Z");
 assert.throws(()=>validarLicenciaColaborador("Q12345678",null,vence,null),/categoría/);
 assert.throws(()=>validarLicenciaColaborador("Q12345678","A-I",null,null),/vencimiento/);
 assert.throws(()=>validarLicenciaColaborador(null,"A-I",vence,null),/número/);
 assert.throws(()=>validarLicenciaColaborador("Q12345678","A-I",vence,new Date("2030-01-01")),/emisión/);
});
test("Gerencia y Recursos Humanos seleccionan sus propios paneles, con la misma cuenta",()=>{
 const u={role:"GERENCIA" as const,grants:[{role:"RRHH" as const,revokedAt:null}]};
 assert.deepEqual(panelesDisponibles(u),["area:GERENCIA","area:RRHH"]);
 assert.equal(nombrePanel("area:RRHH"),"Recursos Humanos");
 assert.deepEqual(rolesParaPanel(u,"area:GERENCIA"),["GERENCIA"]);
 assert.deepEqual(rolesParaPanel(u,"area:RRHH"),["RRHH"]);
 assert.equal(puedeSeleccionarPanel(u,"area:OPERACIONES"),false);
});
test("Homologación y Almacén permanecen funciones, no paneles administrativos inventados",()=>{
 const u={role:"OPERACIONES" as const,grants:[{role:"HOMOLOGACION" as const,revokedAt:null},{role:"ALMACEN" as const,revokedAt:null}]};
 assert.deepEqual(panelesDisponibles(u),["administrativo"]);
});
test("Un cruce real de guardias se rechaza; guardias consecutivas no se cruzan",()=>{
 const primera={startsAt:new Date("2026-11-23T08:00:00-05:00"),endsAt:new Date("2026-11-23T20:00:00-05:00")};
 const cruce={startsAt:new Date("2026-11-23T16:00:00-05:00"),endsAt:new Date("2026-11-24T00:00:00-05:00")};
 const siguiente={startsAt:primera.endsAt,endsAt:new Date("2026-11-24T08:00:00-05:00")};
 assert.equal(overlaps(primera,cruce),true);
 assert.equal(overlaps(primera,siguiente),false);
 assert.match(file("app/actions-operativas.ts"),/Cruce de horarios/);
 assert.match(file("components/dominio/ContenidoModulo.tsx"),/Tu perfil puede consultar el ROSTER, pero no asignar guardias/);
});
test("La migración de datos es aditiva y conserva las fichas y usuarios",()=>{
 const sql=file("prisma/migrations/20261123001900_datos_contacto_licencia/migration.sql");
 assert.match(sql,/ALTER TABLE "Worker" ADD COLUMN "phone"/);
 assert.match(sql,/ADD COLUMN "licenseCategory"/);
 assert.doesNotMatch(sql,/DROP|DELETE|TRUNCATE/i);
 assert.match(file("app/actions-operativas.ts"),/actualizarDatosContactoLicencia/);
});
test("No se elimina el 404 corregido de las fichas de colaboradores",()=>{
 const ficha=file("app/dashboard/ficha-colaborador/[id]/page.tsx");
 assert.match(ficha,/prisma\.worker\.findUnique/);
 assert.match(ficha,/canAccess\(rolesParaPanel\(user,panel\),"personal"\)/);
});
