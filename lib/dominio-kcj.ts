// Reglas puras reutilizables; no dependencias de Next.js ni de Prisma.
export type Fitness = "APTO"|"RESTRINGIDO"|"NO_APTO"|"PENDIENTE";
export type DutyKind = "GUARDIA"|"DESCANSO";
export interface Interval { startsAt:Date; endsAt:Date }
export interface VehicleEligibility { active:boolean; documents:{kind:string;expiresAt:Date;verifiedAt:Date|null}[]; hasOpenWorkOrder:boolean; hasCriticalSafetyCase:boolean; withThirdParty:boolean; custodyUnderReview?:boolean; mineRequired:boolean; mineCardExpiresAt:Date|null; until:Date; }
export interface DriverEligibility { active:boolean; licenseExpires:Date|null; fitness:Fitness|null; fitnessExpires:Date|null; requiredClearancesValid:boolean; dutyKind:DutyKind|null; }
export function validInterval(interval:Interval):boolean { return Number.isFinite(interval.startsAt.getTime()) && Number.isFinite(interval.endsAt.getTime()) && interval.endsAt.getTime()>interval.startsAt.getTime(); }
export function overlaps(a:Interval,b:Interval):boolean { return a.startsAt<b.endsAt && b.startsAt<a.endsAt; }
export function eligibilityVehicle(x:VehicleEligibility):string[] {
 const reasons:string[]=[];
 if(!x.active)reasons.push("La unidad está inactiva");
 const docs=["SOAT","REVISION_TECNICA"];
 for(const kind of docs){if(!x.documents.some(d=>d.kind===kind&&d.verifiedAt!==null&&d.expiresAt>=x.until))reasons.push(`Documento ${kind} no vigente o sin validar`);}
 if(x.hasOpenWorkOrder)reasons.push("Mantenimiento pendiente de liberación");
 if(x.hasCriticalSafetyCase)reasons.push("Restricción SSOMA crítica abierta");
 if(x.withThirdParty)reasons.push("Unidad bajo custodia de tercero");
 if(x.custodyUnderReview)reasons.push("Unidad recibida pendiente de verificación técnica y SSOMA");
 if(x.mineRequired&&(!x.mineCardExpiresAt||x.mineCardExpiresAt<x.until))reasons.push("Tarjeta Amarilla no válida durante todo el servicio");
 return reasons;
}
export function eligibilityDriver(x:DriverEligibility, until:Date):string[] {
 const r:string[]=[];
 if(!x.active)r.push("Trabajador inactivo");
 if(!x.licenseExpires||x.licenseExpires<until)r.push("Licencia vencida o ausente");
 if(x.fitness!=="APTO"||!x.fitnessExpires||x.fitnessExpires<until)r.push("Aptitud ocupacional no válida");
 if(!x.requiredClearancesValid)r.push("Homologación requerida no vigente");
 if(x.dutyKind!=="GUARDIA")r.push("Fuera de guardia publicada");
 return r;
}
export interface ActionState { status:"PENDIENTE"|"EJECUTADA"|"VERIFICADA"; evidenceKey:string|null; verifiedBy:string|null; }
export function mayCloseSafetyCase(actions:ActionState[],technicalReason:string):boolean {
 return (actions.length===0 && technicalReason.trim().length>=15) || (actions.length>0 && actions.every(a=>a.status==="VERIFICADA"&&Boolean(a.evidenceKey)&&Boolean(a.verifiedBy)));
}
export function scoreQuiz(correctIds:string[],selectedIds:string[]):number {
 if(correctIds.length===0)throw new Error("El cuestionario no tiene preguntas");
 const correct=correctIds.reduce((total,id,index)=>total+(selectedIds[index]===id?1:0),0);
 return Math.round((correct/correctIds.length)*100);
}
export function hoursBetween(startsAt:Date,endsAt:Date):number {
 if(!validInterval({startsAt,endsAt}))throw new Error("Fechas inválidas");
 const h=(endsAt.getTime()-startsAt.getTime())/3600000;
 if(h>24) throw new Error("Una entrada de tareo no puede superar 24 horas");
 return Math.round(h*100)/100;
}
export function tapeColor(month:number):"ROJO"|"VERDE"|"AZUL"|"AMARILLO" {
 if(!Number.isInteger(month)||month<1||month>12)throw new Error("Mes inválido");
 return month<=3?"ROJO":month<=6?"VERDE":month<=9?"AZUL":"AMARILLO";
}
export function canTakeAttempt(count:number,max:number,alreadyPassed:boolean):boolean {return !alreadyPassed && count<max && max>0;}
export function hhcAccredited(hours:number,passed:number):number {return Math.round(hours*passed*100)/100;}

/** El ámbito minero se valida por operación; nunca aceptar una credencial de otra mina. */
export function alcanceMineroValido(alcance:string,mina:string|null|undefined):boolean {
 return Boolean(mina?.trim())&&alcance.trim().toUpperCase()===mina?.trim().toUpperCase();
}
export function recepcionPendiente(kind:string|undefined,tecnica:Date|null|undefined,ssoma:Date|null|undefined):boolean {
 return kind==="RECEPCION"&&(!tecnica||!ssoma);
}
