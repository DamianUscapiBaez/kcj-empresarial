"use server";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {prisma} from "@/lib/prisma";
import {requireRole} from "@/lib/auth";
import {field,optionalField} from "@/lib/form";
import {requireEvidenceOwned} from "@/lib/evidencias";
import {validarDatosActa,compararInventarios,numeroEnteroSeguro,validarLiberacionCustodia} from "@/lib/custodia-kcj";
import {leerFotosRecepcion,validarActivosFotos} from "@/lib/custodia-fotos";

function refrescar(vehicleId:string){
 revalidatePath("/dashboard/custodia");
 revalidatePath(`/dashboard/custodia/${vehicleId}`);
 revalidatePath(`/dashboard/ficha-vehicular/${vehicleId}`);
 revalidatePath("/dashboard/flota");
}
/** Entrega: la instantánea proviene del inventario REAL de esta unidad, no de un modelo genérico. */
export async function registrarEntregaComparativa(form:FormData):Promise<void>{
 const actor=await requireRole("ADMIN","OPERACIONES","JEFE_OPERACIONES");
 const vehicleId=field(form,"vehicleId"),clientEventId=field(form,"clientEventId",8,100);
 const party=field(form,"party",3,140),location=field(form,"location",3,160);
 const senderName=field(form,"senderName",3,140),receiverName=field(form,"receiverName",3,140);
 const condition=field(form,"condition",5,1000);
 const odometerKm=numeroEnteroSeguro(Number(field(form,"odometerKm")));
 const fuelPercent=numeroEnteroSeguro(Number(field(form,"fuelPercent")),0,100);
 validarDatosActa(odometerKm,fuelPercent);
 const evidenceKey=field(form,"evidenceKey",8,400);
 await requireEvidenceOwned(evidenceKey,"CUSTODIA",actor.id);
 await prisma.$transaction(async tx=>{
  const duplicate=await tx.custodyEvent.findUnique({where:{clientEventId}});
  if(duplicate){if(duplicate.vehicleId!==vehicleId||duplicate.kind!=="ENTREGA")throw new Error("Identificador de evento utilizado en otra acta");return;}
  const vehicle=await tx.vehicle.findUniqueOrThrow({where:{id:vehicleId},include:{equipment:true,custody:{orderBy:[{at:"desc"},{id:"desc"}],take:1},workOrders:{where:{status:{not:"LIBERADA"}}},cases:{where:{severity:"CRITICA",status:{not:"CERRADO"}}}}});
  if(!vehicle.active)throw new Error("La unidad está inactiva");
  const latest=vehicle.custody[0];
  if(latest?.kind==="ENTREGA")throw new Error("La unidad ya está bajo custodia de terceros");
  if(latest?.kind==="RECEPCION"&&(!latest.technicalVerifiedAt||!latest.safetyVerifiedAt))throw new Error("La devolución anterior todavía está pendiente de liberación");
  if(vehicle.workOrders.length||vehicle.cases.length)throw new Error("Unidad restringida por Mantenimiento o SSOMA");
  if(!vehicle.equipment.length)throw new Error("Primero registra el inventario real de equipamiento en la ficha de Flota de esta unidad");
  const items=vehicle.equipment.map(i=>({itemCode:i.itemCode,label:i.label,serial:i.serial??null,expectedQuantity:i.actualQuantity,actualQuantity:i.actualQuantity,damagedQuantity:0,condition:i.condition,notes:i.remarks??null,discrepancy:i.condition!=="CONFORME"}));
  items.forEach(it=>numeroEnteroSeguro(it.actualQuantity,0,10000));
  const event=await tx.custodyEvent.create({data:{vehicleId,clientEventId,kind:"ENTREGA",contentVersion:3,party,location,senderName,receiverName,condition,odometerKm,fuelPercent,evidenceKey,recordedBy:actor.id,items:{create:items}}});
  await tx.auditLog.create({data:{userId:actor.id,entity:"CustodyEvent",entityId:event.id,action:"ENTREGA_CON_INVENTARIO_REAL",payload:{vehicleId,type:vehicle.type,items:items.length,odometerKm,fuelPercent}}});
 },{isolationLevel:"Serializable"});
 refrescar(vehicleId);
}
/** Recepción: se compara contra la foto histórica de entrega, sin recalcular desde el inventario vivo. */
export async function registrarRecepcionComparativa(form:FormData):Promise<void>{
 const actor=await requireRole("ADMIN","OPERACIONES","JEFE_OPERACIONES");
 const vehicleId=field(form,"vehicleId"),clientEventId=field(form,"clientEventId",8,100);
 const deliveryId=field(form,"deliveryId"),party=field(form,"party",3,140),location=field(form,"location",3,160);
 const senderName=field(form,"senderName",3,140),receiverName=field(form,"receiverName",3,140);
 const condition=field(form,"condition",5,1000);
 const odometerKm=numeroEnteroSeguro(Number(field(form,"odometerKm")));
 const fuelPercent=numeroEnteroSeguro(Number(field(form,"fuelPercent")),0,100);
 const evidenceKey=field(form,"evidenceKey",8,400);
 await requireEvidenceOwned(evidenceKey,"CUSTODIA",actor.id);
 await prisma.$transaction(async tx=>{
  const duplicate=await tx.custodyEvent.findUnique({where:{clientEventId}});
  if(duplicate){if(duplicate.vehicleId!==vehicleId||duplicate.kind!=="RECEPCION")throw new Error("Identificador de evento utilizado en otra acta");return;}
  const latest=await tx.custodyEvent.findFirst({where:{vehicleId},orderBy:[{at:"desc"},{id:"desc"}],include:{items:true}});
  if(!latest||latest.kind!=="ENTREGA"||latest.id!==deliveryId)throw new Error("La entrega relacionada no es la vigente");
  if(!latest.items.length)throw new Error("El acta histórica no tiene inventario comparativo; requiere regularización controlada");
  if(latest.odometerKm!==null&&odometerKm<latest.odometerKm)throw new Error("El kilometraje de devolución no puede ser menor al de entrega");
  const originals=latest.items.map(x=>({code:x.itemCode,label:x.label,quantity:x.actualQuantity,condition:x.condition,serial:x.serial}));
  const received=originals.map(x=>({code:x.code,quantity:numeroEnteroSeguro(Number(field(form,`quantity_${x.code}`)),0,10000),damaged:numeroEnteroSeguro(Number(field(form,`damaged_${x.code}`)),0,10000),condition:field(form,`condition_${x.code}`),notes:optionalField(form,`notes_${x.code}`,800)??""}));
  const details=compararInventarios(originals,received);
  const fotos=leerFotosRecepcion(form,details);
  const keys=[...fotos.values()].flat();
  const assets=keys.length?await tx.evidenceAsset.findMany({where:{key:{in:keys}},select:{key:true,purpose:true,uploadedBy:true,verifiedAt:true,contentType:true}}):[];
  validarActivosFotos(keys,assets,actor.id);
  const event=await tx.custodyEvent.create({data:{vehicleId,clientEventId,kind:"RECEPCION",contentVersion:3,party,location,senderName,receiverName,condition,odometerKm,fuelPercent,evidenceKey,recordedBy:actor.id,relatedDeliveryId:latest.id,items:{create:details.map(line=>({...line,photos:{create:(fotos.get(line.itemCode)??[]).map(key=>({evidenceKey:key,uploadedById:actor.id}))}}))}}});
  await tx.auditLog.create({data:{userId:actor.id,entity:"CustodyEvent",entityId:event.id,action:"RECEPCION_COMPARADA_FOTOS",payload:{vehicleId,deliveryId,diferencias:details.filter(x=>x.discrepancy).length,fotos:keys.length,odometerKm,fuelPercent}}});
 },{isolationLevel:"Serializable"});
 refrescar(vehicleId);
}
/** Resolver una diferencia no significa certificar la unidad; libera solo su revisión administrativa. */
export async function resolverDiferenciaCustodia(form:FormData):Promise<void>{
 const actor=await requireRole("ADMIN","OPERACIONES","JEFE_OPERACIONES");
 const lineId=field(form,"lineId"),reason=field(form,"reason",12,1000),evidenceKey=field(form,"evidenceKey",8,400);
 await requireEvidenceOwned(evidenceKey,"CUSTODIA",actor.id);
 let vehicleId="";
 await prisma.$transaction(async tx=>{
  const line=await tx.custodyInventoryLine.findUniqueOrThrow({where:{id:lineId},include:{custodyEvent:true}});
  const event=line.custodyEvent;
  if(event.kind!=="RECEPCION"||!line.discrepancy||line.resolvedAt)throw new Error("No existe una diferencia abierta para resolver");
  const latest=await tx.custodyEvent.findFirst({where:{vehicleId:event.vehicleId},orderBy:[{at:"desc"},{id:"desc"}]});
  if(latest?.id!==event.id)throw new Error("La recepción no es el evento vigente");
  vehicleId=event.vehicleId;
  await tx.custodyInventoryLine.update({where:{id:lineId},data:{resolvedAt:new Date(),resolvedBy:actor.id,resolutionReason:reason,resolutionEvidenceKey:evidenceKey}});
  await tx.auditLog.create({data:{userId:actor.id,entity:"CustodyInventoryLine",entityId:lineId,action:"RESOLVER_DIFERENCIA_CUSTODIA",payload:{reason,evidenceKey}}});
 },{isolationLevel:"Serializable"});
 refrescar(vehicleId);
}
/** Revisión de seguridad: no aceptar conformidades con diferencias pendientes. */
export async function validarSinDiferenciasPendientes(custodyEventId:string):Promise<void>{
 const [pending,openWork,critical]=await Promise.all([
  prisma.custodyInventoryLine.count({where:{custodyEventId,discrepancy:true,resolvedAt:null}}),
  prisma.workOrder.count({where:{vehicle:{custody:{some:{id:custodyEventId}}},status:{not:"LIBERADA"}}}),
  prisma.safetyCase.count({where:{vehicle:{custody:{some:{id:custodyEventId}}},severity:"CRITICA",status:{not:"CERRADO"}}})
 ]);
 validarLiberacionCustodia(pending,openWork,critical);
}
