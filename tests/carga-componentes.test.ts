import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import test from "node:test";

const root=process.cwd();
const read=(path:string)=>readFileSync(join(root,path),"utf8");

test("Las consultas a catálogos se ejecutan por módulo y no globalmente",()=>{
 const source=read("components/dominio/ContenidoModulo.tsx");
 assert.match(source,/requiereCatalogoPersonal\(modulo\)/);
 assert.match(source,/requiereCatalogoVehiculos\(modulo\)/);
 const map=read("lib/carga-componentes.ts");
 assert.match(map,/"roster"/);
 assert.match(map,/"operaciones"/);
 assert.doesNotMatch(map,/new Set<ModuleSlug>\(\["reportes"/);
});

test("El dashboard no colapsa por un único fallo de indicador",()=>{
 const source=read("app/dashboard/page.tsx");
 assert.match(source,/Promise\.allSettled/);
 assert.match(source,/failedMetrics/);
 assert.match(source,/item\.n===null\?"—"/);
});

test("Hay límites de error que indican fallos sin confundirlos con cero registros",()=>{
 assert.match(read("app/dashboard/[modulo]/error.tsx"),/No fue posible cargar los registros/);
 assert.match(read("components/ui/fields.tsx"),/Sin opciones disponibles/);
 assert.match(read("components/ui/fields.tsx"),/role="status"/);
});

test("Diagnóstico separa conectividad, migración y estado de módulos sin exponer credenciales",()=>{
 const health=read("app/api/health/route.ts");
 assert.match(health,/information_schema\.tables/);
 assert.match(health,/KCJ_SCHEMA_PENDING/);
 const diagnostic=read("app/api/diagnostico/componentes/route.ts");
 assert.match(diagnostic,/user\.role!=="ADMIN"/);
 assert.match(diagnostic,/Promise\.allSettled/);
 assert.doesNotMatch(diagnostic,/passwordHash|DATABASE_URL/);
});
