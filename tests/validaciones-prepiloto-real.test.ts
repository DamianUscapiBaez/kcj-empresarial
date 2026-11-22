import test from "node:test";
import assert from "node:assert/strict";
import {deltaInventario,severidadSSOMA,rolAltaColaborador,validarAltaConAcceso,autorizarOperacionServicio,enteroOperativo} from "../lib/validaciones-prepiloto.ts";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
test("Stock: solo INGRESO y SALIDA, cantidades enteras y positivas",()=>{
 assert.equal(deltaInventario("INGRESO",3),3);assert.equal(deltaInventario("SALIDA",2),-2);
 for(const dir of ["DEVOLUCION","ABONO","", "salida"])assert.throws(()=>deltaInventario(dir,2));
 for(const n of [0,1.4,-2,Infinity,100001])assert.throws(()=>deltaInventario("INGRESO",n));
});
test("SSOMA: rechazar severidades arbitrarias que evitan el bloqueo crítico",()=>{
 for(const s of ["BAJA","MEDIA","ALTA","CRITICA"])assert.equal(severidadSSOMA(s),s);
 for(const s of ["CRÍTICA","CRITICO","NO_CRITICO", "", "BAJA "])assert.throws(()=>severidadSSOMA(s));
});
test("Alta integrada: no hacer cuentas desde RRHH ni roles de propietario",()=>{
 assert.doesNotThrow(()=>validarAltaConAcceso(true,true));
 assert.doesNotThrow(()=>validarAltaConAcceso(false,false));
 assert.throws(()=>validarAltaConAcceso(true,false));
 assert.equal(rolAltaColaborador("CONDUCTOR"),"CONDUCTOR");
 assert.throws(()=>rolAltaColaborador("PROPIETARIO"));
 assert.throws(()=>rolAltaColaborador("AREA_FLOTA"));
});
test("Alta integrada: transacción única, usuario vinculado y salida confirmada",()=>{
 const code=src("app/actions-operativas.ts"),form=src("components/dominio/FormulariosColaborador.tsx");
 assert.match(code,/workerId:p\.id/);assert.match(code,/ALTA_INTEGRADA_CUENTA/);
 assert.match(code,/isolationLevel:"Serializable"/);assert.match(form,/name="crearAcceso"/);
 assert.match(form,/name="confirmPassword"/);
});

test("Conductor y cuenta dual: el panel bloquea servicios ajenos",()=>{
 assert.doesNotThrow(()=>autorizarOperacionServicio("conductor","worker1","worker1",true));
 assert.throws(()=>autorizarOperacionServicio("conductor","worker1","worker2",true));
 assert.throws(()=>autorizarOperacionServicio("conductor",null,"worker2",true));
 assert.doesNotThrow(()=>autorizarOperacionServicio("administrativo",null,"worker2",true));
 assert.throws(()=>autorizarOperacionServicio("administrativo","worker1","worker2",false));
});
test("Inicio, asignación y cambio de unidad repiten elegibilidad dentro de transacción serializable",()=>{
 const code=src("app/actions-operativas.ts");
 for(const name of ["asignarServicio","iniciarServicio","cambiarUnidad"]){
  const start=code.indexOf(`export async function ${name}(`);
  const next=code.indexOf("export async function ",start+20);
  const body=code.slice(start,next<0?undefined:next);
  assert.match(body,/comprobarAsignacion\([\s\S]+?,tx\)/);
  assert.match(body,/TransactionIsolationLevel\.Serializable/);
 }
});

test("Kilometraje y año sin decimales ni valores fuera de rango",()=>{
 assert.equal(enteroOperativo(2025,1980,2100),2025);
 assert.equal(enteroOperativo(100150,0,10000000),100150);
 for(const v of [2026.5,1979,2101,NaN])assert.throws(()=>enteroOperativo(v,1980,2100));
});
test("Reportes nuevos con evidencia vinculada al actor autenticado",()=>{
 const code=src("app/actions-operativas.ts");
 assert.match(code,/requireEvidenceOwnedAny\(evidenceKey,\["CONNECT","SSOMA"\],u\.id\)/);
});

test("Las veinte entradas tienen guía operativa sin inventar departamentos",()=>{
 const catalog=src("lib/modulos.ts"),guide=src("lib/guia-modulos.ts");
 const slugs=[...catalog.matchAll(/slug:"([a-z-]+)"/g)].map(x=>x[1]);
 for(const slug of slugs)assert.match(guide,new RegExp(`(?:\"${slug}\"|${slug}):\\{`));
});
