import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dniCuentaInicial,rolesDesdeAreas,nombreEsPosibleDuplicado,nombreNormalizado} from "../lib/cuentas-por-area.ts";
const source=(name:string)=>readFileSync(new URL(`../${name}`,import.meta.url),"utf8");
test("DNI de 8 dígitos es texto, se conserva cero inicial y no admite usuario alterno",()=>{
 assert.equal(dniCuentaInicial(" 01234567 "),"01234567");
 for(const value of ["1234","123456789","87654A21","12.345.678","0000000 "])assert.throws(()=>dniCuentaInicial(value));
});
test("El área Conductor asigna un panel independiente sin segunda cuenta",()=>{
 assert.deepEqual(rolesDesdeAreas({area:"Operaciones",secondaryArea:"Conductor"}),{principal:"OPERACIONES",adicionales:["CONDUCTOR"]});
 assert.deepEqual(rolesDesdeAreas({area:"Conductor",secondaryArea:"Operaciones"}),{principal:"OPERACIONES",adicionales:["CONDUCTOR"]});
 assert.deepEqual(rolesDesdeAreas({area:"Conductor",secondaryArea:null}),{principal:"CONDUCTOR",adicionales:[]});
 assert.deepEqual(rolesDesdeAreas({area:"Recursos Humanos",secondaryArea:"Conductor"}),{principal:"RRHH",adicionales:["CONDUCTOR"]});
});
test("Las áreas sin rol operativo autorizado no se convierten en ADMIN",()=>{
 assert.deepEqual(rolesDesdeAreas({area:"Tecnología de la Información",secondaryArea:null}),{principal:"COLABORADOR",adicionales:[]});
 assert.deepEqual(rolesDesdeAreas({area:"Nueva área",secondaryArea:null}),{principal:"COLABORADOR",adicionales:[]});
 assert.equal(rolesDesdeAreas({area:"Gerencia",secondaryArea:null}).principal,"GERENCIA");
});
test("Normalización de nombres para prevenir duplicados por espacios y mayúsculas",()=>{
 assert.equal(nombreNormalizado("  Ana   María   Pérez "),"Ana María Pérez");
 assert.equal(nombreEsPosibleDuplicado(" ANA  María Pérez ","Ana María Pérez"),true);
 assert.equal(nombreEsPosibleDuplicado("Ana Pérez","Ana Torres"),false);
});
test("Formulario de alta no repite usuario, rol ni contraseña; servidor los deriva",()=>{
 const ui=source("components/dominio/FormulariosColaborador.tsx");
 const code=source("app/actions-operativas.ts");
 const create=code.split("export async function crearTrabajador")[1].split("/** Centro de Control configura")[0];
 assert.match(ui,/Crear cuenta de acceso para este colaborador/);
 for(const field of ["login","role","password","confirmPassword"])assert.doesNotMatch(ui,new RegExp(`name="${field}"`));
 assert.match(create,/rolesDesdeAreas\(areas\)/);
 assert.match(create,/login:dni/);
 assert.match(create,/passwordHash\(dni\)/);
 assert.match(create,/findUnique\(\{where:\{document\}/);
 assert.match(create,/name:\{equals:name,mode:"insensitive"\}/);
 assert.match(create,/isolationLevel:Prisma.TransactionIsolationLevel.Serializable/);
});
test("Eliminar áreas y fichas requiere referencia vacía, audita el motivo y no elimina historiales",()=>{
 const code=source("app/actions-operativas.ts");
 for(const action of ["desactivarAreaTrabajo","reactivarAreaTrabajo","eliminarAreaSinUso","eliminarColaboradorSinHistorial"])assert.match(code,new RegExp(`export async function ${action}`));
 assert.match(code,/where:\{OR:\[\{area:name\},\{secondaryArea:name\}\]\}/);
 assert.match(code,/e.code==="P2003"/);
 assert.match(code,/ELIMINAR_FICHA_ERRONEA_SIN_HISTORIAL/);
});
