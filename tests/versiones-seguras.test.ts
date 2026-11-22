import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
function patch(v:string){return v.split('.').map(Number);}
function atLeast(v:string,min:string){const a=patch(v),b=patch(min);return a[0]===b[0]&&a[1]===b[1]&&a[2]>=b[2];}
test('Next.js declara parche de seguridad del 3 nov 2026 o posterior en línea 15.5',()=>assert.ok(atLeast(pkg.dependencies.next,'15.5.29')));
test('React y React DOM se mantienen alineados con versión 19.2.9 parcheada',()=>{
 assert.equal(pkg.dependencies.react,pkg.dependencies['react-dom']);assert.ok(atLeast(pkg.dependencies.react,'19.2.9'));
});
test('El proyecto permite ejecutar auditorías offline sin descargar paquetes',()=>{
 assert.match(pkg.scripts['audit:static'],/auditoria-estatica-profunda/);
 assert.match(pkg.scripts['audit:navegacion'],/auditar-navegacion/);
});
