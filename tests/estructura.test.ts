import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync,statSync} from "node:fs";
import path from "node:path";
import {modules} from "../lib/modulos.ts";
const root=path.resolve(import.meta.dirname,"..");
function read(p:string){return readFileSync(path.join(root,p),"utf8");}
function all(dir:string):string[]{return readdirSync(dir).flatMap(f=>{const p=path.join(dir,f);return statSync(p).isDirectory()?all(p):[p];});}
test("Se conservan los 17 módulos oficiales y almacén",()=>{assert.equal(modules.length,18);for(const title of ["Acceso y usuarios","ROSTER","KCJ CONNECT","SSOMA","Aula Virtual","Salud Ocupacional","Entrega y recepción"])assert.ok(modules.some(x=>x.title===title));});
test("No hay archivos heredados HTML, BAT, PowerShell o Python",()=>{const bad=all(root).filter(p=>/\.(html|py|bat|ps1)$/i.test(p));assert.deepEqual(bad,[]);});
test("Prisma define 31 modelos y 10 enumeraciones",()=>{const s=read("prisma/schema.prisma");assert.equal([...s.matchAll(/^model\s+\w+\s*\{/gm)].length,31);assert.equal([...s.matchAll(/^enum\s+\w+\s*\{/gm)].length,10);});
test("Migración contiene tablas base",()=>{const sql=read("prisma/migrations/20261121000100_initial/migration.sql");assert.equal([...sql.matchAll(/^CREATE TABLE /gm)].length,31);for(const name of ["Worker","Vehicle","User","Roster","Service","SafetyCase","Course","QuizAttempt","Receipt","EvidenceAsset"])assert.ok(sql.includes(`CREATE TABLE "${name}"`));});
test("Seed nunca incluye credenciales públicas",()=>{assert.ok(read("prisma/seed.ts").includes("KCJ_ADMIN_PASSWORD"));assert.ok(!read("datos_iniciales/catalogos.json").includes("password"));});
test("No se habilita un cierre SSOMA por cambio visual de estado",()=>{const code=read("app/actions-operativas.ts");assert.ok(code.includes("mayCloseSafetyCase"));assert.ok(code.includes("requireRole(\"SSOMA\")"));});
test("Cuestionarios con dos intentos por defecto",()=>assert.match(read("prisma/schema.prisma"),/maxAttempts Int @default\(2\)/));
test("Existe una sola ficha maestra por trabajador",()=>assert.match(read("prisma/schema.prisma"),/document String @unique/));
test("Server Actions llevan la directiva use server al principio",()=>{for(const p of ["app/actions-auth.ts","app/actions-aula.ts","app/actions-operativas.ts"])assert.match(read(p).trimStart(),/^"use server";/);});
test("No se expone un administrador demo con clave conocida",()=>{const files=["prisma/seed.ts","datos_iniciales/catalogos.json",".env.example"];for(const file of files){const text=read(file);assert.ok(!/90000000|admin123|123456789/.test(text));}});
test("El seed demo se restringe a una base aislada",()=>{const src=read("prisma/seed-demo.ts");assert.ok(src.includes("KCJ_ALLOW_DEMO_SEED"));assert.ok(src.includes("test|demo|sandbox"));});
test("Cambios de cargo se registran y se revocan sesiones al inactivar",()=>{const src=read("app/actions-operativas.ts");assert.ok(src.includes("ACTUALIZAR_CARGO_ESTADO"));assert.ok(src.includes("tx.session.updateMany"));});
test("No hay migraciones destructivas automáticas",()=>{for(const p of ["package.json",".github/workflows/produccion-migraciones.yml",".github/workflows/seed-inicial.yml"]){assert.ok(!read(p).includes("migrate reset"));assert.ok(!read(p).includes("db push --force-reset"));}});
test("Evidencias privadas no se escriben en carpeta pública",()=>{const src=read("app/api/evidencias/presign/route.ts");assert.ok(src.includes("PutObjectCommand"));assert.ok(!src.includes("public/"));assert.ok(read("app/api/evidencias/confirmar/route.ts").includes("HeadObjectCommand"));});
test("La carga de evidencias se autoriza por finalidad",()=>{const src=read("app/api/evidencias/presign/route.ts");assert.ok(src.includes("allowed[v.purpose].includes(u.role)"));});
test("Prisma y migración incluyen activos de evidencias",()=>{assert.ok(read("prisma/schema.prisma").includes("enum EvidencePurpose"));assert.ok(read("prisma/migrations/20261121000100_initial/migration.sql").includes('"EvidencePurpose"'));});
test("El acceso de propietario restringe sus vehículos",()=>assert.ok(read("components/dominio/ContenidoModulo.tsx").includes('ownerId:user.ownerId??"none"')));
test("Se aplica idempotencia por identificador de evento",()=>{assert.ok(read("prisma/schema.prisma").includes("clientEventId String @unique"));assert.ok(read("app/actions-aula.ts").includes("clientEventId"));});
