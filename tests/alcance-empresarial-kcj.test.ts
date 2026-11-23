import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
test("KCJ CONTROL es empresarial: servicios diversos con ingreso a mina condicionado",()=>{
 const code=read("components/dominio/ContenidoModulo.tsx");
 assert.match(code,/Cliente o área solicitante/);
 assert.match(code,/Servicio, sector o recorrido \(según corresponda\)/);
 assert.match(code,/¿Este servicio exige habilitación de ingreso a mina\?/);
 const domain=read("app/actions-operativas.ts");
 assert.match(domain,/mineRequired:flag\(form,"mineRequired"\)/);
 assert.match(domain,/mineScope:flag\(form,"mineRequired"\)\?field/);
});
test("Habilitación minera aplica por operación, sin imponer Las Bambas a toda la flota",()=>{
 const f=read("app/dashboard/ficha-vehicular/[id]/page.tsx");
 assert.doesNotMatch(f,/const mineScope="LAS_BAMBAS"/);
 assert.match(f,/Operación minera aplicable/);
 assert.match(f,/Historial documental de requisitos por operación minera/);
 assert.match(f,/Tarjeta Amarilla \/ Pase Minero/);
});
test("Homologación personal se separa de documentos de cada unidad",()=>{
 const personal=read("components/dominio/ContenidoModulo.tsx");
 const veh=read("app/actions-vehiculos.ts");
 assert.match(personal,/Homologación de personal — exclusivamente trabajadores/);
 assert.match(veh,/registrarPaseMineroUnidad/);
 assert.match(veh,/registrarRequisitoMineroUnidad/);
});

test("Los documentos sin vencimiento no se falsean con fechas inventadas",()=>{
 const schema=read("prisma/schema.prisma");
 assert.match(schema,/model VehicleDocument \{[\s\S]*?expiresAt DateTime\?/);
 const server=read("app/actions-operativas.ts");
 assert.match(server,/\["SOAT","REVISION_TECNICA","POLIZA"\]\.includes\(kind\)&&!expiresAt/);
 const domain=read("lib/dominio-kcj.ts");
 assert.match(domain,/d.expiresAt!==null&&d.expiresAt>=x.until/);
});
