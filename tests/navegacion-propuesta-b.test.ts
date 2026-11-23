import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(file:string)=>readFileSync(join(process.cwd(),file),"utf8");
const nav=read("lib/navegacion-kcj.ts");
const layout=read("app/dashboard/layout.tsx");
const panel=read("app/dashboard/page.tsx");
const group=read("components/ui/NavigationGroup.tsx");
const defined=[...read("lib/modulos.ts").matchAll(/\{slug:"([\w-]+)",title:/g)].map(m=>m[1]);
const groups=[...nav.matchAll(/\{title:"([^"]+)", slugs:\[([^\]]+)\], pausas:(true|false)\}/g)]
 .map(m=>({title:m[1],slugs:[...m[2].matchAll(/"([\w-]+)"/g)].map(v=>v[1]),pausas:m[3]==="true"}));
test("Propuesta B: siete categorías correctas y en orden",()=>{
 assert.deepEqual(groups.map(g=>g.title),[
 "Servicios y jornadas","Unidades y habilitaciones","Trabajadores y formación",
 "Seguridad y cumplimiento","Recursos corporativos","Análisis y reportes","Accesos y configuración"]);
});
test("Se mantienen los módulos anteriores y se agregan dos simulacros en formación",()=>{
 const slugs=groups.flatMap(g=>g.slugs);
 assert.equal(defined.length,20);
 assert.equal(slugs.length,20);
 assert.equal(new Set(slugs).size,20);
 assert.deepEqual([...slugs].sort(),[...defined].sort());
 assert.match(nav,/slugs\.filter\(slug=>canAccess\(role,slug\)\)/);
 assert.match(layout,/navigationForRole\(rolesParaPanel\(user,panel\)\)/);
 assert.doesNotMatch(layout,/navigationForRole\(rolesActivos\(user\)\)/);
});
test("Pausas Activas se consulta una vez dentro de Servicios y jornadas y mantiene permisos",()=>{
 assert.equal(groups.filter(g=>g.pausas).length,1);
 assert.equal(groups[0].pausas,true);
 assert.match(nav,/pauseRoles:readonly Role\[\]=\["ADMIN","GERENCIA","OPERACIONES","JEFE_OPERACIONES","SSOMA","SALUD"\]/);
 assert.match(nav,/showPausas:section\.pausas&&puedeConsultarPausas\(role\)/);
 assert.match(group,/showPausas&&<PausasNavigationLink\/>/);
 assert.doesNotMatch(layout,/Línea de Mando/);
 assert.match(read("app/dashboard/pausas-activas/page.tsx"),/tieneRol\(user,"ADMIN","GERENCIA","OPERACIONES","JEFE_OPERACIONES","SSOMA","SALUD"\)/);
});
test("Menú desplegable accesible y coherente en escritorio y móvil",()=>{
 assert.match(group,/aria-expanded=\{open\}/);
 assert.match(group,/aria-controls=\{regionId\}/);
 assert.match(group,/onClick=\{\(\)=>setOpen/);
 assert.match(group,/usePathname\(\)/);
 assert.match(layout,/lg:sticky/);
 assert.match(layout,/MobileNavigation/);
 assert.match(read("components/ui/MobileNavigation.tsx"),/setOpen\(false\)/);
 assert.equal((layout.match(/<Navigation sections=\{sections\}\/>/g)??[]).length,2);
 assert.match(panel,/navigationForRole\(rolesParaPanel\(user,panel\)\)/);
});
test("Etiquetas más claras sin cambiar los identificadores de negocio",()=>{
 assert.match(nav,/operaciones:"Servicios y asignaciones"/);
 assert.match(nav,/roster:"ROSTER · Guardias y descansos"/);
 assert.match(nav,/tareo:"Tareo · Horas trabajadas"/);
 assert.match(nav,/homologacion:"Homologación de personal"/);
 assert.match(panel,/labelsNavegacion\[slug\]\?\?meta\.title/);
});
