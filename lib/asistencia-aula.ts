/** Reglas puras; el reloj y la identidad se determinan siempre en el servidor. */
export type TrainingModality = "PRESENCIAL"|"VIRTUAL";
export type AttendanceStatus = "PENDIENTE"|"ASISTIO"|"NO_ASISTIO"|"JUSTIFICADO";
export const MODALIDADES_AULA:readonly TrainingModality[]=["PRESENCIAL","VIRTUAL"];
export const ESTADOS_ASISTENCIA:readonly AttendanceStatus[]=["ASISTIO","NO_ASISTIO","JUSTIFICADO"];
export function validarRegistroPresencial(modalidad:TrainingModality,estado:string,motivo:string,yaAcreditado:boolean):AttendanceStatus {
 if(modalidad!=="PRESENCIAL")throw new Error("La asistencia virtual se comprueba desde la sesión del trabajador");
 if(!ESTADOS_ASISTENCIA.includes(estado as AttendanceStatus))throw new Error("Estado de asistencia inválido");
 if(estado!=="ASISTIO"&&motivo.trim().length<8)throw new Error("Especifique el motivo de la inasistencia (mínimo 8 caracteres)");
 if(yaAcreditado&&estado!=="ASISTIO")throw new Error("No se puede invalidar una capacitación ya acreditada sin un proceso formal de rectificación");
 return estado as AttendanceStatus;
}
export function puedeCerrarParticipacionVirtual(inicio:Date|null,fin:Date,minutos:number,materialConfirmado:boolean):boolean {
 return !!inicio&&Number.isInteger(minutos)&&minutos>=1&&minutos<=240&&materialConfirmado&&fin.getTime()>=inicio.getTime()+minutos*60_000;
}
export function acreditableSinExamen(requiereExamen:boolean,requiereMaterial:boolean,materialValidado:boolean,asistio:boolean):boolean {
 return !requiereExamen&&asistio&&(!requiereMaterial||materialValidado);
}
