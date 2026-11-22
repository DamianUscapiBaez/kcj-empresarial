import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {parseDayInLima, rosterSituation, pauseState} from "../lib/pausas-utils.ts";
const root=join(import.meta.dirname,"..");
const read=(s:string)=>readFileSync(join(root,s),"utf8");
test("La ficha se filtra por día Perú y no por hora general",()=>{
 const day=parseDayInLima("2026-11-21");
 assert.equal(day.start.toISOString(),"2026-11-21T05:00:00.000Z");
 assert.equal(day.end.toISOString(),"2026-11-22T05:00:00.000Z");
});
test("El descanso no se marca como incumplimiento de pausa",()=>{
 assert.equal(rosterSituation(["DESCANSO"]),"DESCANSANDO");
 assert.equal(rosterSituation(["GUARDIA","DESCANSO"]),"TRABAJO_Y_DESCANSO");
 assert.equal(rosterSituation(["GUARDIA","DESCANSO"],true),"CRUCE_ROSTER");
 assert.equal(pauseState("DESCANSANDO",[]),"NO_APLICA");
 assert.equal(pauseState("DESCANSANDO",[{status:"FINALIZADA"}]),"REVISAR_ROSTER");
 assert.equal(pauseState("TRABAJANDO",[]),"SIN_REGISTRO");
});
test("Pausas Activas figura dentro de Servicios y jornadas y conserva autorización por rol",()=>{
 const nav=read("lib/navegacion-kcj.ts");
 assert.match(nav,/title:"Servicios y jornadas"/);
 assert.match(nav,/pauseRoles:readonly Role\[\]/);
 assert.match(nav,/showPausas:section\.pausas&&puedeConsultarPausas\(role\)/);
 assert.match(read("components/ui/NavigationGroup.tsx"),/PausasNavigationLink/);
 assert.match(read("components/ui/PausasNavigationLink.tsx"),/dashboard\/pausas-activas/);
});
test("La migración agrega pausas sin destruir datos anteriores",()=>{
 const s=read("prisma/migrations/20261121000300_pausas_activas_linea_mando/migration.sql");
 assert.match(s,/CREATE TABLE "ActivePause"/);assert.doesNotMatch(s,/DROP TABLE|TRUNCATE|DELETE FROM/);
 assert.match(read("prisma/schema.prisma"),/model ActivePause/);
});
test("Exportación PDF usa el logo corporativo original y deja auditoría",()=>{
 assert.match(read("lib/pdf-pausas.ts"),/kcj-logo-original\.jpg/);
 assert.match(read("app/api/pausas-activas/pdf/route.ts"),/EXPORTAR_PDF/);
});
