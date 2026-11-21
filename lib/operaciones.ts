import "server-only";
import { prisma } from "@/lib/prisma";
import { eligibilityVehicle, eligibilityDriver, overlaps, type DutyKind } from "@/lib/dominio-kcj";
export async function comprobarAsignacion(workerId:string,vehicleId:string,startsAt:Date,endsAt:Date,mineRequired:boolean,serviceId?:string):Promise<string[]> {
 const [worker,vehicle,driverServices,vehicleServices,rosters]=await Promise.all([
  prisma.worker.findUnique({where:{id:workerId},include:{fitness:true,clearances:true}}),
  prisma.vehicle.findUnique({where:{id:vehicleId},include:{documents:true,workOrders:true,cases:true,custody:{orderBy:{at:"desc"},take:1},clearances:true}}),
  prisma.service.findMany({where:{workerId,status:{in:["ASIGNADO","EN_CURSO"]},id:{not:serviceId}},select:{startsAt:true,endsAt:true}}),
  prisma.service.findMany({where:{vehicleId,status:{in:["ASIGNADO","EN_CURSO"]},id:{not:serviceId}},select:{startsAt:true,endsAt:true}}),
  prisma.roster.findMany({where:{workerId,status:"PUBLICADO",startsAt:{lte:startsAt},endsAt:{gte:endsAt}}})
 ]);
 if(!worker||!vehicle)return ["Conductor o vehículo inexistente"];
 const latestCustody=vehicle.custody[0];
 const hasCard=vehicle.clearances.some(c=>c.kind==="TARJETA_AMARILLA"&&c.verified&&c.validUntil>=endsAt);
 const bad=eligibilityVehicle({active:vehicle.active,documents:vehicle.documents,hasOpenWorkOrder:vehicle.workOrders.some(o=>o.status!=="LIBERADA"),hasCriticalSafetyCase:vehicle.cases.some(c=>c.severity==="CRITICA"&&c.status!=="CERRADO"),withThirdParty:latestCustody?.kind==="ENTREGA",mineRequired,mineCardExpiresAt:hasCard?endsAt:null,until:endsAt});
 const driverMine=worker.clearances.some(c=>c.kind==="CONDUCTOR_MINA"&&c.verified&&c.validUntil>=endsAt);
 const duty=rosters.find(r=>r.kind==="GUARDIA");
 bad.push(...eligibilityDriver({active:worker.active,licenseExpires:worker.licenseExpires,fitness:worker.fitness?.status??null,fitnessExpires:worker.fitness?.validUntil??null,requiredClearancesValid:!mineRequired||driverMine,dutyKind:duty?.kind as DutyKind|undefined??null},endsAt));
 if(rosters.some(r=>r.kind==="DESCANSO"))bad.push("Trabajador en descanso publicado");
 if(driverServices.some(s=>overlaps({startsAt,endsAt},s)))bad.push("Conductor asignado a otro servicio");
 if(vehicleServices.some(s=>overlaps({startsAt,endsAt},s)))bad.push("Unidad asignada a otro servicio");
 return bad;
}
