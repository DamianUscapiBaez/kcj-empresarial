"use server";
import {revalidatePath} from "next/cache";
import {requireRole} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

/** El conductor no puede indicar la fecha/hora: las fija el servidor después de confirmar S3. */
export async function registrarPausaActiva(form:FormData):Promise<void>{
 const user=await requireRole("CONDUCTOR");
 if(!user.workerId||!user.worker)throw new Error("Conductor sin ficha laboral vinculada");
 const evidenceKey=String(form.get("evidenceKey")??"").trim();
 const clientEventId=String(form.get("clientEventId")??"").trim();
 if(clientEventId.length<12||clientEventId.length>110)throw new Error("Identificador de registro inválido");
 if(!evidenceKey)throw new Error("Debe tomar o subir una fotografía antes de registrar su pausa");
 const now=new Date();
 const existing=await prisma.activePause.findUnique({where:{clientEventId}});
 if(existing){if(existing.workerId!==user.workerId)throw new Error("Este evento pertenece a otra persona");return;}
 const guard=await prisma.roster.findFirst({where:{workerId:user.workerId,status:"PUBLICADO",kind:"GUARDIA",startsAt:{lte:now},endsAt:{gt:now}}});
 if(!guard)throw new Error("No hay guardia publicada vigente. Comuníquese con Operaciones");
 const asset=await prisma.evidenceAsset.findUnique({where:{key:evidenceKey}});
 if(!asset||asset.uploadedBy!==user.id||!asset.verifiedAt||asset.purpose!=="CONNECT"||!asset.contentType.startsWith("image/"))throw new Error("Fotografía no verificada o no autorizada");
 const service=await prisma.service.findFirst({where:{workerId:user.workerId,startsAt:{lte:now},endsAt:{gte:now},status:{in:["ASIGNADO","EN_CURSO"]}},include:{vehicle:{select:{code:true,plate:true}}},orderBy:{startsAt:"desc"}});
 await prisma.$transaction(async tx=>{
  const exists=await tx.activePause.findUnique({where:{clientEventId}});
  if(exists){if(exists.workerId!==user.workerId)throw new Error("Evento en conflicto");return;}
  const item=await tx.activePause.create({data:{clientEventId,workerId:user.workerId!,workerName:user.worker!.name,
   serviceId:service?.id,serviceCode:service?.code,vehicleId:service?.vehicleId,unitCode:service?.vehicle?.code,plate:service?.vehicle?.plate,
   evidenceKey,status:"EN_CURSO",plannedMinutes:5,startedAt:now,dueAt:new Date(now.getTime()+5*60_000),registeredBy:user.id}});
  await tx.auditLog.create({data:{userId:user.id,entity:"ActivePause",entityId:item.id,action:"INICIAR_PAUSA",payload:{workerId:user.workerId,serviceId:service?.id??null,evidenceKey,scheduledMinutes:5}}});
 });
 revalidatePath("/dashboard/connect");revalidatePath("/dashboard/pausas-activas");
}
/** Transcurrir cinco minutos no es una verificación automática de ejecución. */
export async function finalizarPausaActiva(form:FormData):Promise<void>{
 const user=await requireRole("CONDUCTOR");
 if(!user.workerId)throw new Error("Ficha laboral no vinculada");
 const id=String(form.get("id")??"");const now=new Date();
 await prisma.$transaction(async tx=>{
  const p=await tx.activePause.findUniqueOrThrow({where:{id}});
  if(p.workerId!==user.workerId)throw new Error("No autorizado");
  if(p.status==="FINALIZADA")return;
  if(p.status!=="EN_CURSO"||!p.dueAt||now<p.dueAt)throw new Error("La duración programada de cinco minutos aún no se cumple");
  const done=await tx.activePause.updateMany({where:{id,status:"EN_CURSO"},data:{status:"FINALIZADA",completedAt:now}});
  if(done.count)await tx.auditLog.create({data:{userId:user.id,entity:"ActivePause",entityId:id,action:"FINALIZAR_PAUSA",payload:{completedAt:now}}});
 });
 revalidatePath("/dashboard/connect");revalidatePath("/dashboard/pausas-activas");
}
export async function informarPausaNoRealizada(form:FormData):Promise<void>{
 const user=await requireRole("CONDUCTOR");
 if(!user.workerId||!user.worker)throw new Error("Conductor sin ficha laboral");
 const reason=String(form.get("reason")??"").trim();
 const clientEventId=String(form.get("clientEventId")??"").trim();
 if(reason.length<10||reason.length>500)throw new Error("Explique el motivo (10 a 500 caracteres)");
 if(clientEventId.length<12||clientEventId.length>110)throw new Error("Identificador inválido");
 const now=new Date();
 const guard=await prisma.roster.findFirst({where:{workerId:user.workerId,status:"PUBLICADO",kind:"GUARDIA",startsAt:{lte:now},endsAt:{gt:now}}});
 if(!guard)throw new Error("Sin guardia publicada vigente; no corresponde registrar incumplimiento durante descanso");
 const existing=await prisma.activePause.findUnique({where:{clientEventId}});
 if(existing){if(existing.workerId!==user.workerId)throw new Error("Identificador ajeno");return;}
 const service=await prisma.service.findFirst({where:{workerId:user.workerId,startsAt:{lte:now},endsAt:{gte:now},status:{in:["ASIGNADO","EN_CURSO"]}},include:{vehicle:{select:{code:true,plate:true}}},orderBy:{startsAt:"desc"}});
 await prisma.$transaction(async tx=>{
  const item=await tx.activePause.create({data:{workerId:user.workerId!,workerName:user.worker!.name,clientEventId,registeredBy:user.id,
   status:"NO_REALIZADA",plannedMinutes:5,missedReason:reason,serviceId:service?.id,vehicleId:service?.vehicleId,
   serviceCode:service?.code,unitCode:service?.vehicle?.code,plate:service?.vehicle?.plate}});
  await tx.auditLog.create({data:{userId:user.id,entity:"ActivePause",entityId:item.id,action:"MOTIVO_NO_PAUSA",payload:{reason,workerId:user.workerId}}});
 });
 revalidatePath("/dashboard/connect");revalidatePath("/dashboard/pausas-activas");
}
