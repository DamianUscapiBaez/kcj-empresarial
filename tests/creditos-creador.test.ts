import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const fuente=readFileSync("lib/creditos-proyecto.ts","utf8");
const pagina=readFileSync("app/dashboard/acerca-del-sistema/page.tsx","utf8");
const layout=readFileSync("app/dashboard/layout.tsx","utf8");

test("Los créditos identifican al creador y la empresa sin atribución ambigua",()=>{
 assert.match(fuente,/creador: "FRANZ VALERIO HUILLCA MAYTAN"/);
 assert.match(fuente,/concepto: "Creador del sistema"/);
 assert.match(fuente,/empresa: "KCJ PERÚ S\.A\.C\."/);
});
test("Los créditos se muestran en una página privada y sin edición desde la interfaz",()=>{
 assert.match(pagina,/await requireUser\(\)/);
 assert.match(pagina,/CREDITOS_PROYECTO\.creador/);
 assert.doesNotMatch(pagina,/<input|<textarea|<form|contentEditable/);
});
test("Hay acceso a los créditos en escritorio, móvil y pie de página",()=>{
 const n=layout.match(/href="\/dashboard\/acerca-del-sistema"/g)?.length??0;
 assert.equal(n,3);
});
