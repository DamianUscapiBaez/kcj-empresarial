"use server";
import {umbralHistorico} from "@/lib/notas-vigesimales";
import {requireEvidence,requireEvidenceOwned} from "@/lib/evidencias";
import {randomBytes} from "node:crypto";
import {Prisma} from "@prisma/client";
import {revalidatePath} from "next/cache";
import {prisma} from "@/lib/prisma";
import {requireRole,requireUser} from "@/lib/auth";
import {tieneRol} from "@/lib/permisos-kcj";
import {rolesSesion} from "@/lib/roles-sesion";
import {field,numberField,optionalField,flag} from "@/lib/form";
import {scoreQuiz,canTakeAttempt} from "@/lib/dominio-kcj";
import {acreditableSinExamen,puedeCerrarParticipacionVirtual,validarRegistroPresencial,MODALIDADES_AULA} from "@/lib/asistencia-aula";
import {catalogoChecklist,validarChecklist,VERSION_CHECKLIST_VEHICULO,type RespuestaChecklist} from "@/lib/vehiculos-integrados";
export async function crearCurso(form:FormData){const u=await requireRole("ADMIN","INSTRUCTOR","SSOMA","SALUD");const c=await prisma.course.create({data:{title:field(form,"title",4,180),description:field(form,"description",10,4000),area:field(form,"area",3,80),hours:numberField(form,"hours",0.25,100),passingScore:umbralHistorico(numberField(form,"passingScoreVigesimal",0,20)),maxAttempts:2,requireMaterial:true,requiresExam:!flag(form,"noExam"),modality:(()=>{const m=field(form,"modality");if(!MODALIDADES_AULA.includes(m as "PRESENCIAL"|"VIRTUAL"))throw new Error("Modalidad inválida");return m as "PRESENCIAL"|"VIRTUAL";})(),minVirtualMinutes:(()=>{const n=numberField(form,"minVirtualMinutes",1,240);if(!Number.isInteger(n))throw new Error("La duración mínima debe ser un número entero de minutos");return n;})()}});await prisma.auditLog.create({data:{userId:u.id,entity:"Course",entityId:c.id,action:"CREAR"}});revalidatePath("/dashboard/aula");}
export async function crearPregunta(form:FormData){const u=await requireRole("ADMIN","INSTRUCTOR","SSOMA","SALUD");const courseId=field(form,"courseId");const options=[field(form,"optionA",1,800),field(form,"optionB",1,800),field(form,"optionC",1,800),field(form,"optionD",1,800)];const correct=field(form,"correct");if(!["0","1","2","3"].includes(correct))throw new Error("Alternativa correcta inválida");await prisma.$transaction(async tx=>{const course=await tx.course.findUniqueOrThrow({where:{id:courseId},include:{questions:true}});if(course.published)throw new Error("Curso publicado: para modificarlo cree otra versión");const q=await tx.question.create({data:{courseId,statement:field(form,"statement",8,1200),position:course.questions.length+1,choices:{create:options.map((text,index)=>({text,correct:index===Number(correct)}))}}});await tx.auditLog.create({data:{userId:u.id,entity:"Question",entityId:q.id,action:"CREAR"}});});revalidatePath("/dashboard/aula");}
export async function publicarCurso(form:FormData){const u=await requireRole("INSTRUCTOR","SSOMA","SALUD","ADMIN");const courseId=field(form,"courseId");await prisma.$transaction(async tx=>{const c=await tx.course.findUniqueOrThrow({where:{id:courseId},include:{questions:{include:{choices:true}},materials:true}});if(c.published)throw new Error("Ya publicado");if(c.requireMaterial&&c.materials.length===0)throw new Error("Agregue material formativo antes de publicar");if(c.requiresExam&&(c.questions.length===0||c.questions.some(q=>q.choices.length<2||q.choices.filter(x=>x.correct).length!==1)))throw new Error("El cuestionario no está completo o no tiene exactamente una respuesta correcta por pregunta");await tx.course.update({where:{id:courseId},data:{published:true}});await tx.auditLog.create({data:{userId:u.id,entity:"Course",entityId:courseId,action:"PUBLICAR",payload:{version:c.version}}});});revalidatePath("/dashboard/aula");}
export async function convocarCurso(form:FormData){const u=await requireRole("INSTRUCTOR","SSOMA","SALUD","ADMIN");const workerId=field(form,"workerId"),courseId=field(form,"courseId");const c=await prisma.course.findUniqueOrThrow({where:{id:courseId}});if(!c.published||c.archivedAt)throw new Error("El curso debe estar publicado y vigente");const e=await prisma.enrollment.upsert({where:{courseId_workerId:{courseId,workerId}},create:{courseId,workerId},update:{}});await prisma.auditLog.create({data:{userId:u.id,entity:"Enrollment",entityId:e.id,action:"CONVOCAR"}});revalidatePath("/dashboard/aula");}
/** La asistencia presencial es un acto explícito del instructor, nunca un clic sin estado ni motivo. */
export async function marcarAsistencia(form:FormData){
 const u=await requireRole("INSTRUCTOR","SSOMA","SALUD","ADMIN");
 const id=field(form,"enrollmentId"),statusRaw=field(form,"status"),reason=optionalField(form,"reason",600)??"";
 const evidenceKey=optionalField(form,"evidenceKey",400);
 if(evidenceKey){const asset=await prisma.evidenceAsset.findUnique({where:{key:evidenceKey}});if(!asset?.verifiedAt||asset.purpose!=="AULA"||asset.uploadedBy!==u.id)throw new Error("Evidencia no confirmada o no pertenece al responsable");}
 await prisma.$transaction(async tx=>{
  const e=await tx.enrollment.findUniqueOrThrow({where:{id},include:{course:true}});
  if(!e.course.published||e.course.archivedAt)throw new Error("La convocatoria no pertenece a un curso publicado vigente");
  const status=validarRegistroPresencial(e.course.modality,statusRaw,reason,Boolean(e.approvedAt));
  if(e.attendanceStatus===status&&e.attendedAt&&status==="ASISTIO")throw new Error("La asistencia ya fue registrada; no duplique el registro");
  const now=new Date(),attended=status==="ASISTIO";
  const accreditable=acreditableSinExamen(e.course.requiresExam,e.course.requireMaterial,Boolean(e.materialValidatedAt),attended);
  await tx.enrollment.update({where:{id},data:{attendanceStatus:status,attendanceRecordedAt:now,attendanceRecordedBy:u.id,attendanceEvidenceKey:evidenceKey,absenceReason:attended?null:reason,attendedAt:attended?now:null,...(accreditable&&!e.approvedAt?{approvedAt:now,score:100,certificateCode:`KCJ-${randomBytes(12).toString("hex").toUpperCase()}`}:{})}});
  await tx.auditLog.create({data:{userId:u.id,entity:"Enrollment",entityId:id,action:"ASISTENCIA_PRESENCIAL",payload:{status,reason:attended?null:reason,hasEvidence:Boolean(evidenceKey),previousStatus:e.attendanceStatus}}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});revalidatePath("/dashboard/aula");
}
/** Acceso a material no equivale a asistencia virtual: se abre una sesión fechada por el servidor. */
export async function iniciarParticipacionVirtual(form:FormData){
 const u=await requireUser(),id=field(form,"enrollmentId");
 if(!u.workerId)throw new Error("Usuario sin ficha laboral vinculada");
 await prisma.$transaction(async tx=>{
  const e=await tx.enrollment.findUniqueOrThrow({where:{id},include:{course:true}});
  if(e.workerId!==u.workerId||e.course.modality!=="VIRTUAL"||!e.course.published||e.course.archivedAt)throw new Error("Convocatoria virtual no autorizada");
  if(e.attendedAt||e.virtualStartedAt)return;
  await tx.enrollment.update({where:{id},data:{virtualStartedAt:new Date()}});
  await tx.auditLog.create({data:{userId:u.id,entity:"Enrollment",entityId:id,action:"INICIO_PARTICIPACION_VIRTUAL"}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});revalidatePath("/dashboard/aula");
}
/** Cierra una sesión únicamente con participación mínima y material confirmado. */
export async function finalizarParticipacionVirtual(form:FormData){
 const u=await requireUser(),id=field(form,"enrollmentId");
 if(!u.workerId)throw new Error("Usuario sin ficha laboral vinculada");
 await prisma.$transaction(async tx=>{
  const e=await tx.enrollment.findUniqueOrThrow({where:{id},include:{course:true}});
  if(e.workerId!==u.workerId||e.course.modality!=="VIRTUAL"||!e.course.published||e.course.archivedAt)throw new Error("Convocatoria virtual no autorizada");
  if(e.attendedAt||e.virtualCompletedAt)return;
  const now=new Date();
  if(!puedeCerrarParticipacionVirtual(e.virtualStartedAt,now,e.course.minVirtualMinutes,!e.course.requireMaterial||Boolean(e.materialValidatedAt)))throw new Error(`Debe confirmar el material y completar al menos ${e.course.minVirtualMinutes} minutos desde el inicio`);
  const accreditable=acreditableSinExamen(e.course.requiresExam,e.course.requireMaterial,Boolean(e.materialValidatedAt),true);
  await tx.enrollment.update({where:{id},data:{attendedAt:now,attendanceStatus:"ASISTIO",attendanceRecordedAt:now,attendanceRecordedBy:u.id,virtualCompletedAt:now,...(accreditable&&!e.approvedAt?{approvedAt:now,score:100,certificateCode:`KCJ-${randomBytes(12).toString("hex").toUpperCase()}`}:{})}});
  await tx.auditLog.create({data:{userId:u.id,entity:"Enrollment",entityId:id,action:"ASISTENCIA_VIRTUAL_AUTOMATICA",payload:{inicio:e.virtualStartedAt?.toISOString(),fin:now.toISOString(),minutosMinimos:e.course.minVirtualMinutes,materialValidado:Boolean(e.materialValidatedAt)}}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});revalidatePath("/dashboard/aula");
}

export async function responderCuestionario(form:FormData){const u=await requireUser();const enrollmentId=field(form,"enrollmentId");await prisma.$transaction(async tx=>{const e=await tx.enrollment.findUniqueOrThrow({where:{id:enrollmentId},include:{course:{include:{questions:{orderBy:{position:"asc"},include:{choices:true}}}},attempts:true}});if(!u.workerId||u.workerId!==e.workerId)throw new Error("Solo el trabajador convocado puede rendir su evaluación");if(!tieneRol(u,"CONDUCTOR","ADMIN","INSTRUCTOR","SSOMA","SALUD"))throw new Error("No autorizado");if(!e.course.published||!e.course.requiresExam||!e.attendedAt)throw new Error("Curso no habilitado para rendir evaluación");if(e.course.requireMaterial&&!e.materialValidatedAt)throw new Error("Debe validar el material antes del examen");const attemptsInCycle=e.attempts.filter(a=>a.cycle===e.cycle);if(!canTakeAttempt(attemptsInCycle.length,e.course.maxAttempts,Boolean(e.approvedAt)))throw new Error("No hay intentos disponibles; se requiere refuerzo autorizado");const answers=e.course.questions.map(q=>field(form,`question_${q.id}`));const correct=e.course.questions.map(q=>{const c=q.choices.find(c=>c.correct);if(!c)throw new Error("Pregunta sin respuesta válida");return c.id;});for(let i=0;i<e.course.questions.length;i++)if(!e.course.questions[i].choices.some(c=>c.id===answers[i]))throw new Error("Alternativa no pertenece al cuestionario");const score=scoreQuiz(correct,answers);const passed=score>=e.course.passingScore;const sequence=e.attempts.length+1;await tx.quizAttempt.create({data:{enrollmentId,sequence,cycle:e.cycle,score,passed,responses:e.course.questions.map((q,index)=>({questionId:q.id,choiceId:answers[index]}))}});await tx.enrollment.update({where:{id:enrollmentId},data:{score,approvedAt:passed?new Date():null,certificateCode:passed?`KCJ-${randomBytes(12).toString("hex").toUpperCase()}`:null}});await tx.auditLog.create({data:{userId:u.id,entity:"Enrollment",entityId:enrollmentId,action:"EVALUACION",payload:{score,passed,sequence}}});},{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});revalidatePath("/dashboard/aula");}
export async function publicarComunicado(form:FormData){const u=await requireRole("ADMIN","GERENCIA","OPERACIONES","JEFE_OPERACIONES","SSOMA");const role=optionalField(form,"targetRole") as import("@prisma/client").Role|null;const title=field(form,"title",5,180),body=field(form,"body",10,5000);const a=await prisma.announcement.create({data:{title,body,targetRole:role,revisions:{create:{version:1,title,body,modifiedBy:u.id}}}});await prisma.auditLog.create({data:{userId:u.id,entity:"Announcement",entityId:a.id,action:"PUBLICAR"}});revalidatePath("/dashboard/comunicaciones");}
export async function confirmarComunicado(form:FormData){const u=await requireUser();const id=field(form,"id");const a=await prisma.announcement.findUniqueOrThrow({where:{id}});if(a.targetRole&&!tieneRol(u,a.targetRole))throw new Error("No es destinatario");await prisma.receipt.upsert({where:{announcementId_userId_version:{announcementId:id,userId:u.id,version:a.version}},create:{announcementId:id,userId:u.id,version:a.version},update:{}});revalidatePath("/dashboard/comunicaciones");}
/** Una inspección diaria solo corresponde a una unidad y servicio asignados al conductor.
 * El resultado se calcula en servidor desde todos los ítems; no se acepta una casilla general falsa.
 */
export async function registrarInspeccion(form:FormData){
 const u=await requireUser();
 const roles=await rolesSesion(u);
 if(!roles.some(r=>r==="CONDUCTOR"||r==="OPERACIONES"||r==="JEFE_OPERACIONES"))throw new Error("Sin permiso para inspeccionar desde el área seleccionada");
 const workerId=roles.includes("CONDUCTOR")?u.workerId:optionalField(form,"workerId");
 if(!workerId)throw new Error("Cuenta sin colaborador vinculado");
 const vehicleId=field(form,"vehicleId"),serviceId=field(form,"serviceId"),clientEventId=field(form,"clientEventId",8,100);
 const linked=await prisma.service.findUnique({where:{id:serviceId},include:{vehicle:{select:{type:true}}}});
 if(!linked||linked.workerId!==workerId||linked.vehicleId!==vehicleId||!["ASIGNADO","EN_CURSO"].includes(linked.status)||!linked.vehicle)throw new Error("El servicio no está asignado a ese conductor y unidad");
 const now=new Date();
 if(linked.startsAt.getTime()>now.getTime()+2*60*60*1000||linked.endsAt.getTime()<now.getTime()-4*60*60*1000)throw new Error("La inspección debe realizarse cerca de la guardia asignada");
 const entries:RespuestaChecklist[]=catalogoChecklist(linked.vehicle.type).map(item=>({code:item.code,result:field(form,`resultado_${item.code}`) as RespuestaChecklist["result"],note:optionalField(form,`detalle_${item.code}`,800)??""}));
 const checked=validarChecklist(linked.vehicle.type,entries);
 const evidence=optionalField(form,"evidenceKey",400);
 if(evidence)await requireEvidenceOwned(evidence,"CONNECT",u.id);
 const kilometers=optionalField(form,"kilometers");
 const km=kilometers!==null?numberField(form,"kilometers",0,10000000):null;
 await prisma.$transaction(async tx=>{
  const prior=await tx.inspection.findUnique({where:{clientEventId}});
  if(prior){if(prior.workerId!==workerId||prior.vehicleId!==vehicleId||prior.serviceId!==serviceId)throw new Error("Identificador de inspección en conflicto");return;}
  const current=await tx.service.findUnique({where:{id:serviceId},include:{vehicle:{select:{type:true}}}});
  if(!current||current.workerId!==workerId||current.vehicleId!==vehicleId||!["ASIGNADO","EN_CURSO"].includes(current.status)||current.vehicle?.type!==linked.vehicle!.type||current.startsAt.getTime()>now.getTime()+2*60*60*1000||current.endsAt.getTime()<now.getTime()-4*60*60*1000)throw new Error("La asignación cambió. Actualiza el formulario antes de registrar la inspección");
  const inspection=await tx.inspection.create({data:{workerId,vehicleId,serviceId,clientEventId,result:checked.status,templateVersion:VERSION_CHECKLIST_VEHICULO,checklist:{version:VERSION_CHECKLIST_VEHICULO,items:checked.items.map(x=>({code:x.code,result:x.result,note:x.note}))},occurredAt:now,evidenceKey:evidence,kilometers:km}});
  if(checked.status==="CRITICO"){
   const codes=new Set(checked.items.filter(x=>x.result==="NO_CONFORME").map(x=>x.code));
   const findings=catalogoChecklist(linked.vehicle!.type).filter(x=>x.critical&&codes.has(x.code)).map(x=>x.label);
   await tx.safetyCase.create({data:{reference:`CON-${inspection.id}`,category:"Condición insegura",severity:"CRITICA",title:"Inspección crítica de conductor",details:findings.join("; "),workerId,vehicleId,evidenceKey:evidence}});
  }
  await tx.auditLog.create({data:{userId:u.id,entity:"Inspection",entityId:inspection.id,action:"REGISTRAR_CHECKLIST_DIARIO",payload:{workerId,vehicleId,serviceId,status:checked.status,itemCount:checked.items.length}}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 revalidatePath("/dashboard/connect");
}

export async function versionarComunicado(form:FormData){const u=await requireRole("ADMIN","GERENCIA","OPERACIONES","JEFE_OPERACIONES","SSOMA");const id=field(form,"id"),title=field(form,"title",5,180),body=field(form,"body",10,5000);await prisma.$transaction(async tx=>{const old=await tx.announcement.findUniqueOrThrow({where:{id}});const next=old.version+1;await tx.announcementRevision.create({data:{announcementId:id,version:next,title,body,modifiedBy:u.id}});await tx.announcement.update({where:{id},data:{title,body,version:next,publishedAt:new Date()}});await tx.auditLog.create({data:{userId:u.id,entity:"Announcement",entityId:id,action:"NUEVA_VERSION",payload:{previousVersion:old.version,newVersion:next}}});});revalidatePath("/dashboard/comunicaciones");}

/** El contenido se guarda en el curso, no en el navegador del trabajador. */
export async function agregarMaterial(form:FormData){
 const u=await requireRole("ADMIN","INSTRUCTOR","SSOMA","SALUD");
 const courseId=field(form,"courseId"),title=field(form,"title",4,180),content=field(form,"content",15,8000);
 await prisma.$transaction(async tx=>{
  const course=await tx.course.findUniqueOrThrow({where:{id:courseId}});
  if(course.published||course.archivedAt)throw new Error("Solo puede agregar material a un borrador");
  const material=await tx.courseMaterial.create({data:{courseId,title,content}});
  await tx.auditLog.create({data:{userId:u.id,entity:"CourseMaterial",entityId:material.id,action:"CREAR"}});
 });revalidatePath("/dashboard/aula");
}
export async function confirmarMaterial(form:FormData){
 const u=await requireUser(),id=field(form,"enrollmentId");
 await prisma.$transaction(async tx=>{
  const e=await tx.enrollment.findUniqueOrThrow({where:{id},include:{course:{include:{materials:true}}}});
  if(!u.workerId||u.workerId!==e.workerId)throw new Error("Solo el trabajador convocado confirma el material");
  if(!e.course.published||e.course.archivedAt||e.course.requireMaterial&&e.course.materials.length===0)throw new Error("Material no disponible");
  if(e.course.modality==="VIRTUAL"&&!e.virtualStartedAt)throw new Error("Primero inicie la participación virtual");
  const accreditable=acreditableSinExamen(e.course.requiresExam,e.course.requireMaterial,true,Boolean(e.attendedAt));
  await tx.enrollment.update({where:{id},data:{materialValidatedAt:e.materialValidatedAt??new Date(),...(accreditable&&!e.approvedAt?{approvedAt:new Date(),score:100,certificateCode:`KCJ-${randomBytes(12).toString("hex").toUpperCase()}`}:{})}});
  await tx.auditLog.create({data:{userId:u.id,entity:"Enrollment",entityId:id,action:"VALIDAR_MATERIAL"}});
 });revalidatePath("/dashboard/aula");
}
export async function autorizarRefuerzo(form:FormData){
 const u=await requireRole("ADMIN","INSTRUCTOR","SSOMA","SALUD");
 const enrollmentId=field(form,"enrollmentId"),reason=field(form,"reason",12,500);
 await prisma.$transaction(async tx=>{
  const e=await tx.enrollment.findUniqueOrThrow({where:{id:enrollmentId},include:{course:true,attempts:true}});
  if(e.approvedAt||!e.course.requiresExam)throw new Error("No procede el refuerzo");
  if(e.attempts.filter(a=>a.cycle===e.cycle).length<e.course.maxAttempts)throw new Error("Aún existen intentos disponibles");
  await tx.enrollment.update({where:{id:enrollmentId,cycle:e.cycle},data:{cycle:{increment:1},score:null}});
  await tx.auditLog.create({data:{userId:u.id,entity:"Enrollment",entityId:enrollmentId,action:"REFUERZO_AUTORIZADO",payload:{reason,previousCycle:e.cycle,newCycle:e.cycle+1}}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});revalidatePath("/dashboard/aula");
}
export async function versionarCurso(form:FormData){
 const u=await requireRole("ADMIN","INSTRUCTOR","SSOMA","SALUD"),id=field(form,"courseId");
 await prisma.$transaction(async tx=>{
  const old=await tx.course.findUniqueOrThrow({where:{id},include:{materials:true,questions:{orderBy:{position:"asc"},include:{choices:true}}}});
  if(!old.published||old.archivedAt)throw new Error("Solo se versiona un curso vigente publicado");
  const seriesKey=old.seriesKey??old.id;
  const next=await tx.course.create({data:{title:old.title,description:old.description,area:old.area,version:old.version+1,hours:old.hours,passingScore:old.passingScore,maxAttempts:old.maxAttempts,requiresExam:old.requiresExam,requireMaterial:old.requireMaterial,modality:old.modality,minVirtualMinutes:old.minVirtualMinutes,seriesKey,materials:{create:old.materials.map(m=>({title:m.title,content:m.content}))},questions:{create:old.questions.map(q=>({statement:q.statement,position:q.position,choices:{create:q.choices.map(c=>({text:c.text,correct:c.correct}))}}))}}});
  await tx.course.update({where:{id},data:{archivedAt:new Date(),seriesKey}});
  await tx.auditLog.create({data:{userId:u.id,entity:"Course",entityId:next.id,action:"NUEVA_VERSION",payload:{from:id,version:next.version}}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});revalidatePath("/dashboard/aula");
}
