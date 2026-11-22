import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const source=(path:string)=>readFileSync(path,'utf8');

test('La interfaz usa el logo KCJ original sin sustituirlo por un logo nuevo',()=>{
 const src=source('components/ui/KcjLogo.tsx');
 assert.match(src,/\/assets\/kcj-logo-original\.jpg/);
 assert.match(src,/object-contain/);
 assert.doesNotMatch(src,/object-cover/);
 const logo=readFileSync('public/assets/kcj-logo-original.jpg');
 assert.ok(logo.length>100_000);
 assert.match(createHash('sha256').update(logo).digest('hex'),/^[a-f0-9]{64}$/);
});

test('Se aplica identidad grafito, rojo y blanco y se retira el azul dorado generico',()=>{
 const palette=source('tailwind.config.ts');
 assert.match(palette,/#A6263A/);
 assert.match(palette,/#2A323A/);
 assert.match(palette,/#F3F5F7/);
 assert.doesNotMatch(palette,/#D69C3A/);
});

test('Login y panel muestran identidad corporativa sin alterar Server Actions',()=>{
 assert.match(source('app/login/page.tsx'),/<KcjLogo/);
 assert.match(source('app/login/page.tsx'),/form action=\{login\}/);
 assert.match(source('app/dashboard/layout.tsx'),/<KcjLogo/);
 assert.match(source('app/dashboard/layout.tsx'),/navigationForRole\(rolesParaPanel\(user,panel\)\)/);
 assert.doesNotMatch(source('app/dashboard/layout.tsx'),/navigationForRole\(rolesActivos\(user\)\)/);
 assert.match(source('app/dashboard/page.tsx'),/prisma\.worker\.count\(\)/);
});

test('Formularios y tablas conservan nombres de campos, acciones y estados vacios',()=>{
 const src=source('components/ui/fields.tsx');
 assert.match(src,/form action=\{action\}/);
 assert.match(src,/name=\{f\.name\}/);
 assert.match(src,/f\.type==="hidden"/);
 assert.match(src,/EvidenceUploader/);
 assert.match(src,/Aún no hay registros/);
});
