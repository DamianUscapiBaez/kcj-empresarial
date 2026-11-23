import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {panelesDisponibles,rolesParaPanel,puedeSeleccionarPanel,destinoPanel} from "../lib/paneles-kcj.ts";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");

test("Paneles: administrativo aparece antes de conductor para una cuenta dual",()=>{
 const cuenta={role:"CONDUCTOR" as const,grants:[{role:"OPERACIONES" as const,revokedAt:null}]};
 assert.deepEqual(panelesDisponibles(cuenta),["administrativo","conductor"]);
 assert.deepEqual(rolesParaPanel(cuenta,"administrativo"),["OPERACIONES"]);
 assert.deepEqual(rolesParaPanel(cuenta,"conductor"),["CONDUCTOR"]);
 assert.equal(destinoPanel("administrativo"),"/dashboard");
 assert.equal(destinoPanel("conductor"),"/dashboard/connect");
});
test("Paneles: doble rol funciona con administrativo principal y conductor adicional",()=>{
 const cuenta={role:"OPERACIONES" as const,grants:[{role:"CONDUCTOR" as const,revokedAt:null}]};
 assert.deepEqual(panelesDisponibles(cuenta),["administrativo","conductor"]);
 assert.equal(puedeSeleccionarPanel(cuenta,"conductor"),true);
});
test("Paneles: rol único entra directamente; rol revocado no otorga panel",()=>{
 assert.deepEqual(panelesDisponibles({role:"CONDUCTOR"}),["conductor"]);
 assert.deepEqual(panelesDisponibles({role:"RRHH"}),["administrativo"]);
 const revocado={role:"CONDUCTOR" as const,grants:[{role:"OPERACIONES" as const,revokedAt:new Date()}]};
 assert.deepEqual(panelesDisponibles(revocado),["conductor"]);
 assert.equal(puedeSeleccionarPanel(revocado,"administrativo"),false);
 assert.equal(puedeSeleccionarPanel({role:"RRHH"},"conductor"),false);
 assert.equal(puedeSeleccionarPanel({role:"CONDUCTOR"},"nada"),false);
});
test("Inicio de sesión: usa una misma sesión, borra cookie de panel anterior y muestra selector solo para doble perfil",()=>{
 const auth=read("app/actions-auth.ts");
 assert.match(auth,/include:\{worker:\{select:\{active:true\}\},grants:\{where:\{revokedAt:null\}\}\}/);
 assert.match(auth,/u\.workerId&&!u\.worker\?\.active/);
 assert.match(auth,/jar\.delete\(COOKIE_PANEL\)/);
 assert.match(auth,/disponibles\.length>1\?"\/seleccionar-panel"/);
 assert.match(auth,/destinoPanel\(disponibles\[0\]/);
 assert.match(read("lib/panel-sesion.ts"),/puedeSeleccionarPanel\(user,elegido\)/);
 assert.match(read("app/actions-panel.ts"),/if\(!puedeSeleccionarPanel\(user,panel\)\)/);
 assert.match(read("app/actions-panel.ts"),/httpOnly:true/);
 assert.match(read("app/actions-panel.ts"),/SELECCION_PANEL/);
});
test("Interfaz: selector muestra Administrativo en primer lugar y Conductor en segundo",()=>{
 const page=read("app/seleccionar-panel/page.tsx");
 assert.ok(page.indexOf("1. Administrativo")<page.indexOf("2. Conductor"));
 assert.match(page,/action=\{seleccionarPanel\}/);
 assert.match(page,/name="panel" value="administrativo"/);
 assert.match(page,/name="panel" value="conductor"/);
 const layout=read("app/dashboard/layout.tsx");
 assert.match(layout,/Cambiar de área \/ panel/);
 assert.match(layout,/navigationForRole\(\["CONDUCTOR"\]\)/);
 assert.match(read("app/dashboard/[modulo]/page.tsx"),/canAccess\(rolesParaPanel\(user,panel\),modulo\)/);
});
test("Centro de Control permite asignar Conductor solo con ficha laboral vinculada",()=>{
 const ops=read("app/actions-operativas.ts");
 assert.match(ops,/"ALMACEN","CONDUCTOR"\]/);
 assert.match(ops,/role==="CONDUCTOR"&&!target\.workerId/);
 assert.match(ops,/tx\.session\.updateMany\(\{where:\{userId\},data:\{revokedAt:new Date\(\)\}\}\)/);
 assert.match(read("components/dominio/ContenidoModulo.tsx"),/CONDUCTOR \(requiere ficha laboral\)/);
});

test("Un colaborador de doble área reporta solo su propio caso desde Conductor",()=>{
 const src=read("app/actions-operativas.ts");
 assert.match(src,/panel==="conductor"&&\(!u\.workerId\|\|w!==u\.workerId\)/);
 assert.doesNotMatch(src,/u\.role==="CONDUCTOR"&&w!==u\.workerId/);
});

test("Gerencia y RRHH tienen selector de áreas, menús y permisos independientes",()=>{
 const k={role:"GERENCIA" as const,grants:[{role:"RRHH" as const,revokedAt:null}]};
 assert.deepEqual(panelesDisponibles(k),["area:GERENCIA","area:RRHH"]);
 assert.deepEqual(rolesParaPanel(k,"area:GERENCIA"),["GERENCIA"]);
 assert.deepEqual(rolesParaPanel(k,"area:RRHH"),["RRHH"]);
 assert.equal(puedeSeleccionarPanel(k,"area:OPERACIONES"),false);
 assert.equal(puedeSeleccionarPanel(k,"administrativo"),false);
});
test("Un permiso funcional no crea departamentos ni paneles falsos",()=>{
 const k={role:"OPERACIONES" as const,grants:[{role:"HOMOLOGACION" as const,revokedAt:null}]};
 assert.deepEqual(panelesDisponibles(k),["administrativo"]);
});
