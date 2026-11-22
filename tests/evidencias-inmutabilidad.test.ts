import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const presign=readFileSync("app/api/evidencias/presign/route.ts","utf8");
const confirm=readFileSync("app/api/evidencias/confirmar/route.ts","utf8");
const schema=readFileSync("prisma/schema.prisma","utf8");
test("el PUT firmado exige condición de solo creación y los clientes la envían",()=>{
 assert.match(presign,/IfNoneMatch:"\*"/);
 for(const name of ["components/ui/EvidenceUploader.tsx","components/dominio/FotosCustodiaUploader.tsx","components/dominio/FirmaCustodiaAmpliada.tsx"]){
  assert.match(readFileSync(name,"utf8"),/"If-None-Match":"\*"/,name);
 }
});
test("al confirmar el objeto se contrasta tamaño declarado y no se reescribe la confirmación",()=>{
 assert.match(schema,/expectedBytes Int\?/);
 assert.match(presign,/expectedBytes:v.bytes/);
 assert.match(confirm,/expectedBytes!==result.ContentLength/);
 assert.match(confirm,/alreadyConfirmed:true/);
});
test("migración aditiva permite huellas nuevas preservando actas anteriores",()=>{
 const migration=readFileSync("prisma/migrations/20261121001200_custodia_firma_v3_y_evidencias_tamano/migration.sql","utf8");
 assert.match(migration,/ADD COLUMN "expectedBytes" INTEGER/);
 assert.match(migration,/IN \(1,2,3\)/);
 assert.doesNotMatch(migration,/DELETE FROM|TRUNCATE|DROP TABLE/i);
});

test("acta imprimible incluye fotografías también en la versión v3",()=>{
 const page=readFileSync("app/actas/custodia/[eventId]/page.tsx","utf8");
 assert.match(page,/contentVersion>=2&&/);
 assert.match(page,/signature.documentHash===huella/);
});
