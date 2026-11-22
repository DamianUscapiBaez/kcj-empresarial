import Link from "next/link";
import {randomUUID} from "node:crypto";
import {Prisma} from "@prisma/client";
import {prisma} from "@/lib/prisma";
import type {requireUser} from "@/lib/auth";
import {rolesActivos} from "@/lib/permisos-kcj";
import {RecordForm,InlineAction,DataTable,type FieldSpec} from "@/components/ui/fields";
import {TEMAS_TECSUP,TEMA_MMG,PRACTICO_TECSUP,TIPOS_PRACTICOS,esEditorSimulacros,puedePracticar} from "@/lib/simulacros-kcj";
import * as acciones from "@/app/actions-simulacros";

type Usuario=Awaited<ReturnType<typeof requireUser>>;
type Modulo="simulacros-tecsup"|"simulacros-mmg";
const opcionesCorrectas=[{value:"A",label:"A"},{value:"B",label:"B"},{value:"C",label:"C"},{value:"D",label:"D"}];
const hidden=(name:string,value:string):FieldSpec=>({name,label:name,type:"hidden",value});
const formatoFecha=(d:Date)=>new Intl.DateTimeFormat("es-PE",{timeZone:"America/Lima",dateStyle:"short",timeStyle:"short"}).format(d);

export async function ContenidoSimulacros({modulo,user}:{modulo:Modulo;user:Usuario}){
 const esTecsup=modulo==="simulacros-tecsup";
 const temas=esTecsup?[...TEMAS_TECSUP]:[TEMA_MMG];
 const codigos=temas.map(t=>t.code);
 const roles=rolesActivos(user),editor=esEditorSimulacros(roles);
 // Nunca leer otros bancos ni resultados fuera del catálogo de este módulo.
 let preguntas:Awaited<ReturnType<typeof prisma.practiceQuestion.findMany>>;
 let estados:Awaited<ReturnType<typeof prisma.practiceTopicState.findMany>>;
 let materiales:Awaited<ReturnType<typeof prisma.practiceMaterial.findMany>>;
 let intentos:Awaited<ReturnType<typeof prisma.practiceAttempt.findMany>>;
 try {
 [preguntas,estados,materiales,intentos]=await Promise.all([
  prisma.practiceQuestion.findMany({where:{topicCode:{in:codigos}},orderBy:{createdAt:"asc"}}),
  prisma.practiceTopicState.findMany({where:{code:{in:codigos}}}),
  prisma.practiceMaterial.findMany({where:{topicCode:{in:esTecsup?[...codigos,PRACTICO_TECSUP]:codigos}},orderBy:{createdAt:"asc"}}),
  user.workerId?prisma.practiceAttempt.findMany({where:{workerId:user.workerId,topicCode:{in:codigos}},orderBy:{createdAt:"desc"},take:60}):Promise.resolve([]),
 ]);
 } catch(error:unknown){
  if(error instanceof Prisma.PrismaClientKnownRequestError && (error.code==="P2021"||error.code==="P2022")){
   console.error("[KCJ_SIMULACROS_MIGRACION_PENDIENTE]",{code:error.code});
   return <section role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 space-y-2 text-amber-950"><h2 className="font-bold">Simulacros pendientes de activación técnica</h2><p className="text-sm">Los dos módulos y sus formularios están incorporados, pero falta aplicar la migración de tablas de simulacros en PostgreSQL. TI debe revisar primero las migraciones anteriores, respaldar la base y validar en ensayo. No se ha eliminado ningún registro.</p></section>;
  }
  throw error;
 }
 const published=new Set(estados.filter(x=>x.published).map(x=>x.code));
 const editableOptions=temas.map(t=>({value:t.code,label:t.title}));
 return <div className="space-y-5">
  <section className="card space-y-2">
   <h2 className="kcj-card-heading">{esTecsup?"Simulacros de preparación TECSUP":"Simulacro MMG – Manejo a la Izquierda"}</h2>
   <p className="text-sm text-kcj-muted">Son <strong>simulacros internos de KCJ PERÚ S.A.C.</strong>, no exámenes oficiales, certificados, notas de homologación ni habilitaciones mineras. KCJ ingresará posteriormente sus preguntas y respuestas.</p>
   <p className="text-sm text-kcj-muted">{esTecsup?"Conductores y Línea de Mando tienen acceso a los temas teóricos permitidos. La preparación práctica en circuito se ofrece exclusivamente como material audiovisual, sin cuestionario.":"Esta práctica teórica es exclusiva de conductores; las funciones ADMIN/INSTRUCTOR pueden preparar su banco de preguntas."}</p>
  </section>
  {editor&&<section className="space-y-4">
    <h2 className="text-lg font-bold text-kcj-charcoal">Administración de contenido — KCJ</h2>
    <p className="text-sm text-kcj-muted">Los temas ya están creados. Primero registra preguntas y alternativas, luego publica el simulacro. Los formularios están habilitados aunque todavía no haya preguntas.</p>
    <div className="grid gap-4 xl:grid-cols-2">
     <RecordForm title="Agregar pregunta y respuesta correcta" action={acciones.agregarPreguntaSimulacro} submit="Guardar pregunta" fields={[
      {name:"topicCode",label:"Tema del simulacro",type:"select",required:true,options:editableOptions},
      {name:"statement",label:"Pregunta",type:"textarea",required:true},
      ...(["A","B","C","D"] as const).map(letter=>({name:`option${letter}`,label:`Alternativa ${letter}`,type:"text" as const,required:true})),
      {name:"correctOption",label:"Alternativa correcta",type:"select",required:true,options:opcionesCorrectas},
     ]}/>
     <RecordForm title="Añadir material de preparación (opcional)" action={acciones.agregarMaterialSimulacro} submit="Guardar material" fields={[
      {name:"topicCode",label:"Tema relacionado",type:"select",required:true,options:editableOptions},
      {name:"title",label:"Título del material",type:"text",required:true},
      {name:"content",label:"Explicación o instrucciones",type:"textarea",required:false},
      {name:"url",label:"Enlace HTTPS (si aplica)",type:"text",required:false,placeholder:"https://..."},
      {name:"evidenceKey",label:"Archivo de estudio PDF o imagen (opcional)",type:"evidence",required:false,evidencePurpose:"AULA"},
     ]}/>
    </div>
   </section>}
  {temas.map(tema=>{
   const qTema=preguntas.filter(x=>x.topicCode===tema.code),qActivas=qTema.filter(x=>x.active),publicado=published.has(tema.code);
   const materialesTema=materiales.filter(m=>m.topicCode===tema.code);
   const puedeResolver=Boolean(user.workerId)&&puedePracticar(roles,tema.code);
   const misIntentos=intentos.filter(x=>x.topicCode===tema.code);
   return <section key={tema.code} className="card space-y-4">
    <header className="flex flex-wrap items-start justify-between gap-3">
     <div className="space-y-1"><h2 className="kcj-card-heading">{tema.title}</h2><p className="text-xs text-kcj-muted">{qActivas.length} preguntas activas · {materialesTema.length} materiales · {publicado?"Publicado":"Borrador — aún no disponible para rendir"}</p></div>
     {editor&&<InlineAction label={publicado?"Despublicar para editar":"Publicar simulacro"} action={acciones.cambiarPublicacionSimulacro} fields={[{name:"topicCode",value:tema.code},{name:"published",value:publicado?"false":"true"}]}/>}
    </header>
    {materialesTema.length>0&&(editor||publicado)&&<div className="space-y-2 rounded-xl bg-slate-50 p-4"><h3 className="font-semibold">Material de estudio (opcional)</h3>{materialesTema.map(m=><div key={m.id} className="rounded-lg border border-kcj-border bg-white p-3"><p className="font-semibold">{m.title}</p>{m.content&&<p className="mt-1 whitespace-pre-wrap text-sm">{m.content}</p>}{m.url&&<Link href={m.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-800 underline">Abrir material externo</Link>}{m.evidenceKey&&<p><Link className="text-sm font-semibold text-blue-800 underline" href={`/api/evidencias/descargar?key=${encodeURIComponent(m.evidenceKey)}`} target="_blank">Abrir archivo de estudio</Link></p>}</div>)}</div>}
    {editor&&<div className="space-y-3">
     <h3 className="font-semibold">Banco de preguntas — edición</h3>
     {qTema.length===0?<p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">Todavía no hay preguntas. Completa el formulario «Agregar pregunta» para habilitar este simulacro.</p>:qTema.map((q,index)=><details key={q.id} className="rounded-lg border border-kcj-border bg-white p-3"><summary className="cursor-pointer text-sm font-semibold">{index+1}. {q.statement} {q.active?"":"(inactiva)"}</summary><div className="mt-3 space-y-2">{publicado?<p className="text-sm text-amber-800">Para corregir una pregunta, despublica primero el simulacro; los intentos anteriores permanecerán registrados.</p>:<>
       <RecordForm title="Editar pregunta y alternativas" submit="Guardar cambios" action={acciones.editarPreguntaSimulacro} fields={[
        hidden("questionId",q.id),{name:"statement",label:"Pregunta",type:"textarea",required:true,value:q.statement},
        {name:"optionA",label:"Alternativa A",required:true,value:q.optionA},{name:"optionB",label:"Alternativa B",required:true,value:q.optionB},
        {name:"optionC",label:"Alternativa C",required:true,value:q.optionC},{name:"optionD",label:"Alternativa D",required:true,value:q.optionD},
        {name:"correctOption",label:"Respuesta correcta",type:"select",required:true,options:opcionesCorrectas,value:q.correctOption},
       ]}/>
       <InlineAction action={acciones.cambiarEstadoPreguntaSimulacro} label={q.active?"Desactivar pregunta":"Reactivar pregunta"} fields={[{name:"questionId",value:q.id}]}/>
       </>}</div></details>)}
    </div>}
    {puedeResolver&&publicado&&qActivas.length>0&&<form action={acciones.responderSimulacro} className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
     <h3 className="font-bold">Realizar simulacro de práctica</h3><p className="text-xs text-kcj-muted">Responde todas las preguntas; al finalizar se guardará tu resultado como práctica interna.</p>
     <input type="hidden" name="topicCode" value={tema.code}/><input type="hidden" name="clientEventId" value={randomUUID()}/>
     {qActivas.map((q,index)=><fieldset key={q.id} className="space-y-2 rounded-lg border bg-white p-3"><legend className="px-1 text-sm font-semibold">{index+1}. {q.statement}</legend>
      {(["A","B","C","D"] as const).map(letter=><label key={letter} className="flex gap-2 text-sm"><input type="radio" name={`answer_${q.id}`} required value={letter}/><span>{letter}. {q[`option${letter}`]}</span></label>)}
     </fieldset>)}
     <button className="btn" type="submit">Finalizar y guardar mi práctica</button>
    </form>}
    {!publicado&&!editor&&<p role="status" className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Aún no hay cuestionario publicado para este tema. KCJ cargará sus preguntas y respuestas posteriormente.</p>}
    {publicado&&!puedeResolver&&!editor&&<p className="text-sm text-slate-600">Este tema no corresponde a tu perfil o tu cuenta todavía no está vinculada a una ficha laboral activa.</p>}
    {puedeResolver&&<DataTable title="Mis intentos de práctica" emptyMessage="Todavía no tienes intentos guardados." rows={misIntentos.map(i=>({id:i.id,data:{Fecha:formatoFecha(i.createdAt),Aciertos:`${i.correctCount} / ${i.totalQuestions}`,Nota:`${i.score}%`}}))}/>}
   </section>;
  })}
  {esTecsup&&(roles.includes("CONDUCTOR")||editor)&&<section className="card space-y-4"><h2 className="kcj-card-heading">Preparación para examen práctico TECSUP — circuito</h2>
   <p className="text-sm text-kcj-muted">Sección audiovisual, <strong>sin simulacro de preguntas</strong>. El circuito será común; KCJ podrá cargar un video distinto para camioneta, microbús, minibús y ómnibus. El recorrido exacto todavía debe validarse con el croquis real; no se publica material inventado.</p>
   {editor&&<RecordForm title="Añadir video o guía de maniobras por vehículo" submit="Guardar material práctico" action={acciones.agregarMaterialSimulacro} fields={[
    hidden("topicCode",PRACTICO_TECSUP),{name:"vehicleType",label:"Tipo de unidad",type:"select",required:true,options:TIPOS_PRACTICOS.map(t=>({value:t,label:t.replace("MICROBUS","Microbús").replace("MINIBUS","Minibús").replace("OMNIBUS","Ómnibus")}))},
    {name:"title",label:"Título",type:"text",required:true},
    {name:"content",label:"Descripción del material",type:"textarea",required:false},
    {name:"url",label:"Enlace al video HTTPS (opcional)",required:false,placeholder:"https://..."},
    {name:"evidenceKey",label:"PDF o imágenes del circuito (opcional)",type:"evidence",required:false,evidencePurpose:"AULA"},
   ]}/>}
   {TIPOS_PRACTICOS.map(tipo=>{const ms=materiales.filter(m=>m.topicCode===PRACTICO_TECSUP&&m.vehicleType===tipo);return <div key={tipo} className="rounded-lg border border-kcj-border p-3"><h3 className="font-semibold">{tipo}</h3>{ms.length===0?<p role="status" className="text-sm text-slate-600">Material pendiente de incorporar por KCJ.</p>:ms.map(m=><div key={m.id} className="mt-2 space-y-1 text-sm"><p className="font-medium">{m.title}</p>{m.content&&<p className="whitespace-pre-wrap">{m.content}</p>}{m.url&&<Link href={m.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-800 underline">Abrir video/guía</Link>}{m.evidenceKey&&<p><Link href={`/api/evidencias/descargar?key=${encodeURIComponent(m.evidenceKey)}`} target="_blank" className="font-semibold text-blue-800 underline">Abrir archivo privado</Link></p>}</div>)}</div>})}
  </section>}
 </div>;
}
