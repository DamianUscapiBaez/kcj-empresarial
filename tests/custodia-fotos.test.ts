import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {huellaActaCustodia} from "../lib/custodia-firmas.ts";
import {leerFotosRecepcion,validarActivosFotos,MAX_FOTOS_CUSTODIA} from "../lib/custodia-fotos.ts";

const base={contentVersion:2,id:"acta-fotográfica",vehicleId:"unidad-01",kind:"RECEPCION",party:"Tercero prueba",location:"Base",senderName:"Pedro Prueba",receiverName:"Juana Prueba",condition:"Se documentan daños",odometerKm:2000,fuelPercent:60,at:new Date("2026-11-21T20:00:00Z"),items:[{itemCode:"EXT",label:"Extintor",serial:"ABC",expectedQuantity:1,actualQuantity:1,damagedQuantity:1,condition:"OBSERVADO",notes:"Con daño visible",discrepancy:true,photos:[{evidenceKey:"archivo_foto_uno"},{evidenceKey:"archivo_foto_dos"}]}]};
test("la huella v2 detecta una foto añadida, retirada o cambiada y es estable ante reordenación",()=>{
 const original=huellaActaCustodia(base);
 assert.equal(original,huellaActaCustodia({...base,items:[{...base.items[0],photos:[...base.items[0].photos].reverse()}]}));
 assert.notEqual(original,huellaActaCustodia({...base,items:[{...base.items[0],photos:[{evidenceKey:"archivo_foto_dos"}]}]}));
 assert.notEqual(original,huellaActaCustodia({...base,items:[{...base.items[0],photos:[{evidenceKey:"archivo_foto_uno"},{evidenceKey:"archivo_foto_tres"}]}]}));
});
test("el hash v1 conserva el esquema anterior aunque existan fotos en un objeto de test",()=>{
 assert.equal(huellaActaCustodia({...base,contentVersion:1}),huellaActaCustodia({...base,contentVersion:1,items:[{...base.items[0],photos:[]}]}));
 assert.throws(()=>huellaActaCustodia({...base,contentVersion:8}));
});
test("exige foto ante daño u observación y no exige foto solo por faltante",()=>{
 const observed=[{itemCode:"EXT",label:"Extintor",damagedQuantity:1,condition:"OBSERVADO"}];
 assert.throws(()=>leerFotosRecepcion(new FormData(),observed),/adjunta una foto/);
 const form=new FormData();form.append("photos_EXT","foto-verificada-001");
 assert.deepEqual(leerFotosRecepcion(form,observed).get("EXT"),["foto-verificada-001"]);
 assert.deepEqual(leerFotosRecepcion(new FormData(),[{...observed[0],damagedQuantity:0,condition:"CONFORME"}]).get("EXT"),[]);
});
test("rechaza claves ajenas, duplicadas, foto excesivas y campos con archivos",()=>{
 const items=[{itemCode:"EXT",label:"Extintor",damagedQuantity:0,condition:"CONFORME"},{itemCode:"BOT",label:"Botiquín",damagedQuantity:0,condition:"CONFORME"}];
 const bad=new FormData();bad.append("photos_OTRO","foto-verificada-001");assert.throws(()=>leerFotosRecepcion(bad,items),/ajeno/);
 const double=new FormData();double.append("photos_EXT","foto-verificada-001");double.append("photos_BOT","foto-verificada-001");assert.throws(()=>leerFotosRecepcion(double,items),/no puede asociarse/);
 const many=new FormData();for(let i=0;i<MAX_FOTOS_CUSTODIA+1;i++)many.append("photos_EXT",`foto-verificada-${i}`);assert.throws(()=>leerFotosRecepcion(many,items),/máximo/);
 const file=new FormData();file.append("photos_EXT",new Blob(["x"]),"foto.png");assert.throws(()=>leerFotosRecepcion(file,items),/inválida/);
});
test("verifica propiedad, confirmación, finalidad y MIME de cada foto",()=>{
 const asset={key:"foto-verificada-001",purpose:"CUSTODIA",uploadedBy:"operador-1",verifiedAt:new Date(),contentType:"image/jpeg"};
 assert.doesNotThrow(()=>validarActivosFotos([asset.key],[asset],"operador-1"));
 assert.throws(()=>validarActivosFotos([asset.key],[{...asset,contentType:"application/pdf"}],"operador-1"));
 assert.throws(()=>validarActivosFotos([asset.key],[{...asset,uploadedBy:"otro"}],"operador-1"));
 assert.throws(()=>validarActivosFotos([asset.key],[{...asset,verifiedAt:null}],"operador-1"));
 assert.throws(()=>validarActivosFotos([asset.key],[],"operador-1"));
});
test("la estructura enlaza imágenes a ítems antes de la firma, con rutas privadas",()=>{
 const schema=readFileSync(new URL("../prisma/schema.prisma",import.meta.url),"utf8");
 const action=readFileSync(new URL("../app/actions-custodia.ts",import.meta.url),"utf8");
 const firma=readFileSync(new URL("../app/actions-firmas-custodia.ts",import.meta.url),"utf8");
 const route=readFileSync(new URL("../app/api/actas/custodia/foto/[photoId]/route.ts",import.meta.url),"utf8");
 assert.match(schema,/model CustodyItemPhoto/);assert.match(schema,/contentVersion Int @default\(1\)/);
 assert.match(schema,/evidenceKey String @unique/);
 assert.match(action,/contentVersion:3/);assert.match(action,/leerFotosRecepcion/);assert.match(action,/validarActivosFotos/);
 assert.match(firma,/items:\{include:\{photos:true\}\}/);
 assert.match(route,/currentUser\(\)/);assert.match(route,/Custodia|CUSTODIA/);assert.match(route,/expiresIn:60/);
});

test("la huella v3 incluye evidencia principal y entrega relacionada; v1 y v2 permanecen compatibles",()=>{
 const v3={...base,contentVersion:3,evidenceKey:"general-01",relatedDeliveryId:"entrega-01"};
 const fingerprint=huellaActaCustodia(v3);
 assert.notEqual(fingerprint,huellaActaCustodia({...v3,evidenceKey:"general-02"}));
 assert.notEqual(fingerprint,huellaActaCustodia({...v3,relatedDeliveryId:"entrega-02"}));
 assert.equal(huellaActaCustodia({...v3,contentVersion:2}),huellaActaCustodia({...v3,contentVersion:2,evidenceKey:"general-02",relatedDeliveryId:"entrega-02"}));
 assert.equal(fingerprint.length,64);
});
