import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
const printable=read("app/actas/custodia/[eventId]/page.tsx");
const vista=read("app/dashboard/custodia/[vehicleId]/page.tsx");
test("cada acta imprimible se obtiene del registro histórico exacto y controla acceso",()=>{
 assert.match(printable,/requireUser\(\)/);
 assert.match(printable,/tieneRol\(user,"ADMIN","OPERACIONES","JEFE_OPERACIONES","MANTENIMIENTO","SSOMA"\)/);
 assert.match(printable,/where:\{id:eventId\}/);
 assert.match(printable,/acta\.items\.map/);
 assert.doesNotMatch(printable,/vehicle\.equipment/);
});
test("la impresión conserva cantidades, diferencias y estados de revisión sin simular firmas",()=>{
 for(const s of ["expectedQuantity","actualQuantity","damagedQuantity","resolutionReason","technicalVerifiedAt","safetyVerifiedAt","No certifica firma"]){
  assert.ok(printable.includes(s),s);
 }
 assert.match(printable,/KcjLogo/);
 assert.match(vista,/Ver acta.*PDF/);
 assert.match(vista,/\/actas\/custodia\/\$\{x\.id\}/);
});
test("ADMIN tiene permiso explícito a evidencia de CUSTODIA en presign y descarga",()=>{
 for(const path of ["app/api/evidencias/presign/route.ts","app/api/evidencias/descargar/route.ts"]){
  assert.match(read(path),/CUSTODIA:\["ADMIN","OPERACIONES","JEFE_OPERACIONES"\]/);
 }
});
