"use server";
import {revalidatePath} from "next/cache";
import {Prisma} from "@prisma/client";
import {requireRole, requireUser} from "@/lib/auth";
import {rolesActivos} from "@/lib/permisos-kcj";
import {field,optionalField} from "@/lib/form";
import {requireEvidenceOwned} from "@/lib/evidencias";
import {prisma} from "@/lib/prisma";
import {calificarSimulacro,esTema,esMaterial,puedePracticar,validarRespuesta,PRACTICO_TECSUP,TIPOS_PRACTICOS} from "@/lib/simulacros-kcj";

const refrescar=()=>{revalidatePath("/dashboard/simulacros-tecsup");revalidatePath("/dashboard/simulacros-mmg");};
const editor=()=>requireRole("ADMIN","INSTRUCTOR");
function codigoTema(form:FormData){const code=field(form,"topicCode",3,80);if(!esTema(code))throw new Error("Tema de simulacro no autorizado");return code;}
function codigoMaterial(form:FormData){const code=field(form,"topicCode",3,80);if(!esMaterial(code))throw new Error("Tema de material no válido");return code;}
function urlValida(url:string|null){if(!url)return null;let parsed:URL;try{parsed=new URL(url);}catch{throw new Error("Utiliza una dirección https:// válida");}if(parsed.protocol!=="https:"||!parsed.hostname)throw new Error("El enlace debe usar HTTPS");return parsed.toString();}

export async function agregarPreguntaSimulacro(form:FormData){
 const u=await editor(),topicCode=codigoTema(form);
 const statement=field(form,"statement",8,1500);
 const options=["optionA","optionB","optionC","optionD"].map(x=>field(form,x,1,700));
 const correctOption=field(form,"correctOption",1,1);
 validarRespuesta(options,correctOption);
 await prisma.$transaction(async tx=>{
  const state=await tx.practiceTopicState.findUnique({where:{code:topicCode}});
  if(state?.published)throw new Error("Despublica el simulacro antes de modificar preguntas");
  const q=await tx.practiceQuestion.create({data:{topicCode,statement,optionA:options[0],optionB:options[1],optionC:options[2],optionD:options[3],correctOption,createdBy:u.id}});
  await tx.auditLog.create({data:{userId:u.id,entity:"PracticeQuestion",entityId:q.id,action:"CREAR_BANCO_SIMULACROS",payload:{topicCode}}});
 });refrescar();
}
export async function editarPreguntaSimulacro(form:FormData){
 const u=await editor(),id=field(form,"questionId"),statement=field(form,"statement",8,1500);
 const options=["optionA","optionB","optionC","optionD"].map(x=>field(form,x,1,700));
 const correctOption=field(form,"correctOption",1,1);validarRespuesta(options,correctOption);
 await prisma.$transaction(async tx=>{
  const previous=await tx.practiceQuestion.findUniqueOrThrow({where:{id}});
  const state=await tx.practiceTopicState.findUnique({where:{code:previous.topicCode}});
  if(state?.published)throw new Error("Despublica antes de editar preguntas");
  await tx.practiceQuestion.update({where:{id},data:{statement,optionA:options[0],optionB:options[1],optionC:options[2],optionD:options[3],correctOption}});
  await tx.auditLog.create({data:{userId:u.id,entity:"PracticeQuestion",entityId:id,action:"EDITAR_PREGUNTA_SIMULACRO",payload:{topicCode:previous.topicCode}}});
 });refrescar();
}
export async function cambiarEstadoPreguntaSimulacro(form:FormData){
 const u=await editor(),id=field(form,"questionId");
 await prisma.$transaction(async tx=>{
  const old=await tx.practiceQuestion.findUniqueOrThrow({where:{id}});
  const state=await tx.practiceTopicState.findUnique({where:{code:old.topicCode}});
  if(state?.published)throw new Error("Despublica el simulacro antes de modificar preguntas");
  await tx.practiceQuestion.update({where:{id},data:{active:!old.active}});
  await tx.auditLog.create({data:{userId:u.id,entity:"PracticeQuestion",entityId:id,action:old.active?"DESACTIVAR_PREGUNTA":"REACTIVAR_PREGUNTA"}});
 });refrescar();
}
export async function agregarMaterialSimulacro(form:FormData){
 const u=await editor(),topicCode=codigoMaterial(form);
 const title=field(form,"title",4,180),content=optionalField(form,"content",6000),url=urlValida(optionalField(form,"url",1000));
 const evidenceKey=optionalField(form,"evidenceKey",400);
 if(!content&&!url&&!evidenceKey)throw new Error("Agrega texto, enlace o archivo de estudio");
 const vehicleType=topicCode===PRACTICO_TECSUP?field(form,"vehicleType",3,60):null;
 if(vehicleType&&!TIPOS_PRACTICOS.includes(vehicleType as typeof TIPOS_PRACTICOS[number]))throw new Error("Categoría de vehículo no válida");
 if(evidenceKey)await requireEvidenceOwned(evidenceKey,"AULA",u.id);
 await prisma.$transaction(async tx=>{
  const m=await tx.practiceMaterial.create({data:{topicCode,title,content,url,evidenceKey,vehicleType,createdBy:u.id}});
  await tx.auditLog.create({data:{userId:u.id,entity:"PracticeMaterial",entityId:m.id,action:"AGREGAR_MATERIAL_SIMULACRO",payload:{topicCode,vehicleType}}});
 });refrescar();
}
export async function cambiarPublicacionSimulacro(form:FormData){
 const u=await editor(),code=codigoTema(form),value=field(form,"published");
 if(value!=="true"&&value!=="false")throw new Error("Acción no válida");
 const published=value==="true";
 await prisma.$transaction(async tx=>{
  if(published){const n=await tx.practiceQuestion.count({where:{topicCode:code,active:true}});if(n<1)throw new Error("Agrega al menos una pregunta completa antes de publicar el simulacro");}
  await tx.practiceTopicState.upsert({where:{code},create:{code,published,publishedAt:published?new Date():null},update:{published,publishedAt:published?new Date():null}});
  await tx.auditLog.create({data:{userId:u.id,entity:"PracticeTopicState",entityId:code,action:published?"PUBLICAR_SIMULACRO":"DESPUBLICAR_SIMULACRO"}});
 });refrescar();
}
export async function responderSimulacro(form:FormData){
 const u=await requireUser(),topicCode=codigoTema(form),clientEventId=field(form,"clientEventId",20,80);
 if(!u.workerId||!u.worker?.active||!puedePracticar(rolesActivos(u),topicCode))throw new Error("Tu perfil no está autorizado para este simulacro");
 await prisma.$transaction(async tx=>{
  const prior=await tx.practiceAttempt.findUnique({where:{clientEventId}});
  if(prior){if(prior.workerId!==u.workerId||prior.topicCode!==topicCode)throw new Error("Identificador de intento en conflicto");return;}
  const state=await tx.practiceTopicState.findUnique({where:{code:topicCode}});
  if(!state?.published)throw new Error("El simulacro aún no ha sido publicado");
  const preguntas=await tx.practiceQuestion.findMany({where:{topicCode,active:true},select:{id:true,correctOption:true}});
  const answers:Record<string,string>={};
  for(const q of preguntas)answers[q.id]=String(form.get(`answer_${q.id}`)??"");
  const result=calificarSimulacro(preguntas,answers);
  const intento=await tx.practiceAttempt.create({data:{clientEventId,topicCode,workerId:u.workerId!,answers:answers as Prisma.InputJsonObject,correctCount:result.aciertos,totalQuestions:result.total,score:result.porcentaje}});
  await tx.auditLog.create({data:{userId:u.id,entity:"PracticeAttempt",entityId:intento.id,action:"SIMULACRO_PRACTICA",payload:{topicCode,score:result.porcentaje,total:result.total}}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});refrescar();
}
