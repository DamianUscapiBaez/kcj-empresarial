import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {compararInventarios,validarDatosActa,validarLiberacionCustodia} from "../lib/custodia-kcj.ts";
import {catalogoEquipamiento} from "../lib/vehiculos-integrados.ts";

const original=[{code:"EXTINTOR",label:"Extintor",quantity:2,condition:"CONFORME",serial:"EX001"},{code:"BOTIQUIN",label:"Botiquín",quantity:1,condition:"CONFORME"}];
test("la devolución exige revisar cada componente y no admite ítems añadidos arbitrariamente",()=>{
 assert.throws(()=>compararInventarios(original,[{code:"EXTINTOR",quantity:2,damaged:0,condition:"CONFORME",notes:""}]));
 assert.throws(()=>compararInventarios(original,[{code:"EXTINTOR",quantity:2,damaged:0,condition:"CONFORME",notes:""},{code:"OTRO",quantity:1,damaged:0,condition:"CONFORME",notes:""}]));
});
test("compara contra instantánea de entrega individual, con faltantes y daños",()=>{
 const r=compararInventarios(original,[{code:"EXTINTOR",quantity:1,damaged:0,condition:"OBSERVADO",notes:"Falta un extintor de la entrega"},{code:"BOTIQUIN",quantity:1,damaged:0,condition:"CONFORME",notes:""}]);
 assert.equal(r[0].discrepancy,true);assert.equal(r[0].expectedQuantity,2);assert.equal(r[0].actualQuantity,1);assert.equal(r[0].serial,"EX001");assert.equal(r[1].discrepancy,false);
});
test("requiere motivo de diferencias y valida kilometraje/combustible",()=>{
 assert.throws(()=>compararInventarios(original,[{code:"EXTINTOR",quantity:1,damaged:0,condition:"CONFORME",notes:""},{code:"BOTIQUIN",quantity:1,damaged:0,condition:"CONFORME",notes:""}]));
 assert.throws(()=>validarDatosActa(120,-1));assert.throws(()=>validarDatosActa(120,101));validarDatosActa(25000,65);
});
test("no permite conformidades con diferencias u órdenes sin resolver",()=>{
 assert.throws(()=>validarLiberacionCustodia(1,0,0));assert.throws(()=>validarLiberacionCustodia(0,1,0));assert.throws(()=>validarLiberacionCustodia(0,0,1));validarLiberacionCustodia(0,0,0);
});
test("flota diversa usa catálogos diferenciados y no una lista única",()=>{
 const camioneta=catalogoEquipamiento("CAMIONETA");const omnibus=catalogoEquipamiento("OMNIBUS");
 assert(!camioneta.some(i=>i.code==="PANTALLA_TV"&&i.mandatory));
 assert(omnibus.length>=camioneta.length);
 assert.notDeepEqual(camioneta.map(i=>i.code),omnibus.map(i=>i.code));
});
test("el formulario de actas utiliza el inventario propio y no clona un estándar universal",()=>{
 const s=readFileSync("app/actions-custodia.ts","utf8");
 assert.match(s,/vehicle\.equipment\.map/);assert.match(s,/latest\.items\.map/);assert.match(s,/requireEvidenceOwned/);
 assert.match(s,/isolationLevel:"Serializable"/);
});
