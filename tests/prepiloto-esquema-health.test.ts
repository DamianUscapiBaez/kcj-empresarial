import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {TABLAS_KCJ,COLUMNAS_CRITICAS_KCJ,MIGRACIONES_KCJ} from "../lib/esquema-requerido-kcj.ts";
const load=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
test("Health comprueba todos los modelos declarados en Prisma, sin falso positivo parcial",()=>{
 const schema=load("prisma/schema.prisma"),health=load("app/api/health/route.ts");
 const models=[...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map(x=>x[1]);
 assert.deepEqual([...TABLAS_KCJ],models);
 assert.ok(TABLAS_KCJ.length>40);
 assert.match(health,/TABLAS_KCJ\.filter/);
 for(const required of ["Worker","WorkArea","User","PracticeQuestion","PracticeTopicState","PracticeAttempt","PracticeMaterial","Service","Roster","Timesheet","CustodyEvent"])assert.ok(TABLAS_KCJ.includes(required as never));
 assert.ok(COLUMNAS_CRITICAS_KCJ.some(x=>x.table==="Worker"&&x.column==="secondaryArea"));
});
test("Diagnóstico de ensayo protegido para ADMIN y revisa migraciones fallidas",()=>{
 const route=load("app/api/diagnostico/prepiloto/route.ts");
 assert.match(route,/await currentUser\(\)/);
 assert.match(route,/includes\("ADMIN"\)/);
 assert.match(route,/pendingMigrations/);
 assert.match(route,/failedMigrations/);
 assert.match(route,/SELECT migration_name/);
 assert.ok(MIGRACIONES_KCJ.length>=13);
});
