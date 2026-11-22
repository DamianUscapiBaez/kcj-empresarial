import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(f:string)=>readFileSync(f,"utf8");

test("Diagnóstico de Colaboradores restringido a ADMIN y sin filas personales en respuesta",()=>{
 const src=read("app/api/diagnostico/colaboradores/route.ts");
 assert.match(src,/currentUser\(\)/);
 assert.match(src,/rolesActivos\(user\)\.includes\("ADMIN"\)/);
 assert.match(src,/missingTables/);
 assert.match(src,/missingColumns/);
 assert.match(src,/expectedMigration/);
 assert.match(src,/Promise\.allSettled/);
 assert.match(src,/prisma\.workArea\.findMany/);
 assert.match(src,/prisma\.worker\.findMany/);
 assert.doesNotMatch(src,/DATABASE_URL|passwordHash|\$queryRawUnsafe/);
});

test("Diagnóstico de módulos valida columna nueva y catálogo WorkArea, no solo count",()=>{
 const src=read("app/api/diagnostico/componentes/route.ts");
 assert.match(src,/name:"Personal",run:async/);
 assert.match(src,/secondaryArea:true/);
 assert.match(src,/prisma\.workArea\.findMany/);
});


test("Health verifica WorkArea y la columna secundaria, no solo Worker",()=>{
 const src=read("app/api/health/route.ts");
 assert.match(src,/WorkArea/);
 assert.match(src,/secondaryArea/);
 assert.match(src,/KCJ_SCHEMA_PENDING/);
});

test("Error Colaboradores ofrece diagnóstico exclusivo de administrador",()=>{
 const src=read("app/dashboard/[modulo]/error.tsx");
 assert.match(src,/usePathname/);
 assert.match(src,/api\/diagnostico\/colaboradores/);
 assert.match(src,/solo ADMIN/);
});
