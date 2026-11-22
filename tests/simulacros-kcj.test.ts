import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TEMAS_TECSUP,TEMA_MMG,PRACTICO_TECSUP,TIPOS_PRACTICOS,puedePracticar,esEditorSimulacros,validarRespuesta,calificarSimulacro,esTemaDeModulo} from '../lib/simulacros-kcj.ts';

test('catálogo: exactamente seis temas teóricos TECSUP y MMG independiente',()=>{
 assert.equal(TEMAS_TECSUP.length,6);
 assert.notEqual(TEMA_MMG.code,TEMAS_TECSUP[0].code);
 assert.ok(TEMAS_TECSUP.every(t=>esTemaDeModulo(t.code,'simulacros-tecsup')));
 assert.equal(esTemaDeModulo(TEMA_MMG.code,'simulacros-tecsup'),false);
 assert.equal(esTemaDeModulo(TEMA_MMG.code,'simulacros-mmg'),true);
});
test('conductor puede practicar TECSUP y MMG, línea de mando no MMG',()=>{
 assert.equal(puedePracticar(['CONDUCTOR'],TEMAS_TECSUP[0].code),true);
 assert.equal(puedePracticar(['CONDUCTOR'],TEMA_MMG.code),true);
 assert.equal(puedePracticar(['JEFE_OPERACIONES'],TEMAS_TECSUP[0].code),true);
 assert.equal(puedePracticar(['JEFE_OPERACIONES'],TEMA_MMG.code),false);
 assert.equal(esEditorSimulacros(['CONDUCTOR']),false);
 assert.equal(esEditorSimulacros(['INSTRUCTOR']),true);
});
test('cuatro alternativas y calificación no oficial por aciertos',()=>{
 validarRespuesta(['a','b','c','d'],'B');
 assert.throws(()=>validarRespuesta(['a','b','c'],'B'));
 assert.throws(()=>validarRespuesta(['a','b','c','d'],'E'));
 assert.deepEqual(calificarSimulacro([{id:'1',correctOption:'B'},{id:'2',correctOption:'A'}],{'1':'B','2':'C'}),{aciertos:1,total:2,porcentaje:50});
});
test('preparación práctica sin evaluación e interfaz restringida a conductor o editor',()=>{
 assert.equal(TIPOS_PRACTICOS.length,4);
 assert.equal(PRACTICO_TECSUP,'TEC_PRACTICO_VIDEO');
 const view=readFileSync(new URL('../components/dominio/ContenidoSimulacros.tsx',import.meta.url),'utf8');
 assert.match(view,/esTecsup&&\(roles\.includes\("CONDUCTOR"\)\|\|editor\)/);
 assert.doesNotMatch(view,/topicCode\s*:\s*PRACTICO_TECSUP.*correctOption/s);
});
