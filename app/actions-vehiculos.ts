"use server";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {prisma} from "@/lib/prisma";
import {requireRole} from "@/lib/auth";
import {field,optionalField,numberField} from "@/lib/form";
import {requireEvidenceOwned} from "@/lib/evidencias";
import {catalogItem,validarInventario,validarChecklist,catalogoChecklist,VERSION_CHECKLIST_VEHICULO,type RespuestaChecklist} from "@/lib/vehiculos-integrados";

const refresh=(id:string)=>{revalidatePath(`/dashboard/ficha-vehicular/${id}`);revalidatePath("/dashboard/flota");};

/** Datos adicionales, sin modificar la identidad, propietario ni registros de la unidad. */
export async function completarFichaVehiculo(form:FormData):Promise<void>{
 const user=await requireRole("ADMIN","OPERACIONES","JEFE_OPERACIONES");
 const vehicleId=field(form,"vehicleId");
 const color=optionalField(form,"color",50),vin=optionalField(form,"vin",50),engineNumber=optionalField(form,"engineNumber",50),mineCode=optionalField(form,"mineCode",50);
 await prisma.$transaction(async tx=>{
  const before=await tx.vehicle.findUniqueOrThrow({where:{id:vehicleId},select:{color:true,vin:true,engineNumber:true,mineCode:true}});
  await tx.vehicle.update({where:{id:vehicleId},data:{color,vin,engineNumber,mineCode}});
  await tx.auditLog.create({data:{userId:user.id,entity:"Vehicle",entityId:vehicleId,action:"COMPLETAR_FICHA_VEHICULAR",payload:{before,after:{color,vin,engineNumber,mineCode}}}});
 });
 refresh(vehicleId);
}

/** Inventario unitario por vehículo (distinto del stock general de Almacén). */
export async function registrarEquipamientoVehiculo(form:FormData):Promise<void>{
 const user=await requireRole("ADMIN","OPERACIONES","JEFE_OPERACIONES");
 const vehicleId=field(form,"vehicleId"),code=field(form,"itemCode",2,80);
 const expected=numberField(form,"expectedQuantity",0,10000),actual=numberField(form,"actualQuantity",0,10000);
 const condition=field(form,"condition"),functionalStatus=field(form,"functionalStatus");
 const serial=optionalField(form,"serial",100),remarks=optionalField(form,"remarks",1000);
 const evidenceKey=optionalField(form,"evidenceKey",400);
 validarInventario({expected,actual,condition,functionalStatus,remarks:remarks??""});
 if(evidenceKey)await requireEvidenceOwned(evidenceKey,"FLOTA",user.id);
 await prisma.$transaction(async tx=>{
  const vehicle=await tx.vehicle.findUniqueOrThrow({where:{id:vehicleId},select:{type:true}});
  const item=catalogItem(vehicle.type,code);
  if(!item.quantity)throw new Error("Este componente se comprueba en checklist, no lleva cantidad de inventario");
  const old=await tx.vehicleEquipment.findUnique({where:{vehicleId_itemCode:{vehicleId,itemCode:code}}});
  const data={category:item.category,label:item.label,expectedQuantity:expected,actualQuantity:actual,condition,functionalStatus,serial,evidenceKey,remarks,updatedBy:user.id};
  const saved=await tx.vehicleEquipment.upsert({where:{vehicleId_itemCode:{vehicleId,itemCode:code}},create:{vehicleId,itemCode:code,...data},update:data});
  await tx.auditLog.create({data:{userId:user.id,entity:"VehicleEquipment",entityId:saved.id,action:old?"ACTUALIZAR_EQUIPAMIENTO":"REGISTRAR_EQUIPAMIENTO",payload:{vehicleId,itemCode:code,before:old?{expected:old.expectedQuantity,actual:old.actualQuantity,condition:old.condition,functionalStatus:old.functionalStatus,serial:old.serial,evidenceKey:old.evidenceKey,remarks:old.remarks}:null,after:{expected,actual,condition,functionalStatus,serial,evidenceKey,remarks}}}});
 },{isolationLevel:"Serializable"});
 refresh(vehicleId);
}

/** Inspección estructurada por ítem. Una inspección no sobrescribe a la anterior. */
export async function registrarChecklistVehiculo(form:FormData):Promise<void>{
 const user=await requireRole("ADMIN","OPERACIONES","JEFE_OPERACIONES");
 const vehicleId=field(form,"vehicleId"),clientEventId=field(form,"clientEventId",10,100);
 const context=field(form,"context");
 if(!["FICHA_INICIAL","REVISION_PROGRAMADA"].includes(context))throw new Error("Tipo de revisión inválido");
 const evidenceKey=optionalField(form,"overallEvidenceKey",400);
 if(evidenceKey)await requireEvidenceOwned(evidenceKey,"FLOTA",user.id);
 await prisma.$transaction(async tx=>{
  const prior=await tx.vehicleChecklist.findUnique({where:{clientEventId}});
  if(prior){if(prior.vehicleId!==vehicleId)throw new Error("Identificador de revisión utilizado en otra unidad");return;}
  const v=await tx.vehicle.findUniqueOrThrow({where:{id:vehicleId},select:{type:true}});
  const responses:RespuestaChecklist[]=catalogoChecklist(v.type).map(it=>({code:it.code,result:field(form,`resultado_${it.code}`) as RespuestaChecklist["result"],note:optionalField(form,`detalle_${it.code}`,800)??""}));
  const checked=validarChecklist(v.type,responses);
  const checklist=await tx.vehicleChecklist.create({data:{vehicleId,clientEventId,context,templateVersion:VERSION_CHECKLIST_VEHICULO,vehicleType:v.type,status:checked.status,items:checked.items.map(x=>({code:x.code,result:x.result,note:x.note})),overallEvidenceKey:evidenceKey,performedBy:user.id}});
  if(checked.status==="CRITICO"){
   const critical=catalogoChecklist(v.type).filter(c=>c.critical&&checked.items.some(x=>x.code===c.code&&x.result==="NO_CONFORME"));
   await tx.safetyCase.create({data:{reference:`FLOTA-${checklist.id}`,category:"Inspección",severity:"CRITICA",title:"Hallazgo crítico en checklist vehicular",details:critical.map(x=>x.label).join("; ").slice(0,3000),vehicleId,evidenceKey}});
  }
  await tx.auditLog.create({data:{userId:user.id,entity:"VehicleChecklist",entityId:checklist.id,action:"INSPECCION_ESTRUCTURADA",payload:{vehicleId,context,status:checked.status,version:VERSION_CHECKLIST_VEHICULO,items:checked.items.length}}});
 },{isolationLevel:"Serializable"});
 refresh(vehicleId);
}
