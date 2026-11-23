import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
const read=(p:string)=>readFileSync(path.join(process.cwd(),p),'utf8');
test('Operaciones controla homologación y flota sin inventar un departamento separado',()=>{
 const actions=read('app/actions-operativas.ts');
 assert.match(actions,/registrarHomologacionPersonal/);
 assert.match(actions,/kind==="TARJETA_AMARILLA"/);
 assert.match(read('app/actions-vehiculos.ts'),/registrarPaseMineroUnidad/);
 assert.match(read('app/dashboard/ficha-vehicular/[id]/page.tsx'),/Habilitación minera/);
});
test('Almacén permite operaciones y consulta para RRHH y Gerencia',()=>{
 const routes=read('lib/modulos.ts');
 assert.match(routes,/almacen:\["ADMIN","ALMACEN","OPERACIONES","JEFE_OPERACIONES","RRHH","MANTENIMIENTO","GERENCIA","SSOMA"\]/);
 const actions=read('app/actions-operativas.ts');
 assert.match(actions,/moverInventario[\s\S]*?requireRole\("ALMACEN","OPERACIONES","JEFE_OPERACIONES"\)/);
});
test('Los flujos CI no requieren package-lock inexistente para cachear npm',()=>{
 for(const f of ['.github/workflows/validacion.yml','.github/workflows/seed-inicial.yml','.github/workflows/produccion-migraciones.yml'])assert.doesNotMatch(read(f),/cache: npm/);
});
test('La navegación agrupa procesos por responsabilidades sin perder los 17 módulos',()=>{
 const nav=read('lib/navegacion-kcj.ts');
 assert.match(nav,/title:"Servicios y jornadas"/);
 assert.match(nav,/"operaciones","roster","tareo"/);
 assert.match(nav,/"flota","mantenimiento","custodia","propietarios"/);
 assert.match(nav,/title:"Recursos corporativos"/);
 assert.match(nav,/"personal","homologacion","rrhh"/);
});

test('La exportación comprueba permisos específicos por reporte',()=>{
 const src=read('app/api/reportes/exportar/route.ts');
 assert.ok(src.includes("autorizaciones:Record<string,readonly string[]>"));
 assert.ok(src.includes("!rolesActivos(u).some(r=>autorizaciones[tipo]?.includes(r))"));
});
