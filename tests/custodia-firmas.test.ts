import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {huellaActaCustodia,nombreFirmante,validarLadoFirma} from "../lib/custodia-firmas.ts";
import {firmaConTrazoSuficiente} from "../lib/custodia-trazos.ts";

const base={id:"acta-001",vehicleId:"unidad-01",kind:"ENTREGA",party:"Empresa de prueba",location:"Base",senderName:"Responsable Uno",receiverName:"Responsable Dos",condition:"Sin observaciones",odometerKm:1000,fuelPercent:50,at:new Date("2026-11-21T18:00:00.000Z"),items:[{itemCode:"EXT",label:"Extintor",serial:null,expectedQuantity:1,actualQuantity:1,damagedQuantity:0,condition:"CONFORME",notes:null,discrepancy:false}]};
test("hash estable al cambiar orden de inventario; detecta modificaciones de contenido",()=>{
 const another={...base,items:[{...base.items[0],itemCode:"BOT",label:"Botiquín"},base.items[0]]};
 assert.equal(huellaActaCustodia(another),huellaActaCustodia({...another,items:[...another.items].reverse()}));
 assert.notEqual(huellaActaCustodia(base),huellaActaCustodia({...base,odometerKm:2000}));
 assert.equal(huellaActaCustodia(base).length,64);
});
test("solo permite dos firmas y asigna el nombre correcto por lado",()=>{
 assert.equal(nombreFirmante(base,"ENTREGA"),"Responsable Uno");
 assert.equal(nombreFirmante(base,"RECIBE"),"Responsable Dos");
 assert.throws(()=>validarLadoFirma("ADMIN"));
 assert.throws(()=>nombreFirmante({...base,senderName:null},"ENTREGA"));
});
test("trazo mínimo detecta firmas vacías, puntos falsos y coordenadas inválidas",()=>{
 assert.equal(firmaConTrazoSuficiente([]),false);
 assert.equal(firmaConTrazoSuficiente([[{x:0.5,y:0.5}]]),false);
 assert.equal(firmaConTrazoSuficiente([Array.from({length:10},(_,i)=>({x:i/20,y:0.35}))]),true);
 assert.equal(firmaConTrazoSuficiente([Array.from({length:10},(_,i)=>({x:1.5+i/20,y:0.35}))]),false);
});
test("estructura requiere una firma por lado, evidencia privada, restricción temporal y auditoría",()=>{
 const schema=readFileSync(new URL("../prisma/schema.prisma",import.meta.url),"utf8");
 const server=readFileSync(new URL("../app/actions-firmas-custodia.ts",import.meta.url),"utf8");
 const component=readFileSync(new URL("../components/dominio/FirmaCustodiaAmpliada.tsx",import.meta.url),"utf8");
 assert.match(schema,/@@unique\(\[custodyEventId,side\]\)/);
 assert.match(server,/requireEvidenceOwned/);
 assert.match(server,/latest\?\.id!==event\.id/);
 assert.match(server,/CAPTURA_FIRMA_MANUSCRITA/);
 assert.match(component,/ResizeObserver/);
 assert.match(component,/touchAction:"none"/);
 assert.match(component,/Tocar para firmar en grande/);
 assert.match(component,/Borrar y repetir/);
});
