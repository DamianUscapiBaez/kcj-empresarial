import test from "node:test";
import assert from "node:assert/strict";
import {notaVigesimal,notaVisible,umbralHistorico,notaCharla} from "../lib/notas-vigesimales.ts";
test("Notas históricas: conversión completa sin pérdida",()=>{for(let i=0;i<=100;i++)assert.equal(umbralHistorico(notaVigesimal(i)!),i);});
test("Cero distinto de pendiente",()=>{assert.equal(notaVisible(0),"00/20");assert.equal(notaVisible(null),"Pendiente");});
test("Nota máxima y decimal",()=>{assert.equal(notaVisible(100),"20/20");assert.equal(notaVisible(83),"16.6/20");});
test("Rechaza notas inválidas",()=>{for(const n of [-1,21,NaN,Infinity,12.13])assert.throws(()=>umbralHistorico(n));for(const n of [-1,101,1.2])assert.throws(()=>notaVigesimal(n));});
test("Charlas dos preguntas: 00, 10, 20",()=>{assert.deepEqual([0,1,2].map(notaCharla),[0,10,20]);assert.throws(()=>notaCharla(3));});
