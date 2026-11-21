/** UTC-05 es la zona horaria oficial de Perú (America/Lima, sin cambio estacional). */
export function parseDayInLima(value:string):{start:Date;end:Date;day:string}{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error("Fecha inválida, utilice AAAA-MM-DD");
 const [yy,mm,dd]=value.split("-").map(Number);
 const start=new Date(Date.UTC(yy,mm-1,dd,5));
 if(new Date(Date.UTC(yy,mm-1,dd)).toISOString().slice(0,10)!==value)throw new Error("Fecha no existente");
 return {start,end:new Date(start.getTime()+86400000),day:value};
}
export function todayInLima(now=new Date()):string{
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Lima",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
 const get=(key:string)=>parts.find(x=>x.type===key)?.value??"";
 return `${get("year")}-${get("month")}-${get("day")}`;
}
export type Situation="TRABAJANDO"|"DESCANSANDO"|"SIN_PROGRAMACION"|"CRUCE_ROSTER"|"TRABAJO_Y_DESCANSO";
export function rosterSituation(kinds:string[],actualOverlap=false):Situation{
 const guard=kinds.includes("GUARDIA"),rest=kinds.includes("DESCANSO");
 if(guard&&rest)return actualOverlap?"CRUCE_ROSTER":"TRABAJO_Y_DESCANSO";
 return guard?"TRABAJANDO":rest?"DESCANSANDO":"SIN_PROGRAMACION";
}
export function pauseState(situation:Situation,records:{status:string}[]):string{
 if(situation==="DESCANSANDO")return records.length?"REVISAR_ROSTER":"NO_APLICA";
 if(records.some(p=>p.status==="FINALIZADA"))return "REGISTRADA";
 if(records.some(p=>p.status==="EN_CURSO"))return "EN_CURSO";
 if(records.some(p=>p.status==="NO_REALIZADA"))return "NO_REALIZADA";
 if(situation==="CRUCE_ROSTER")return "REVISAR_ROSTER";
 return situation==="SIN_PROGRAMACION"?"SIN_PROGRAMACION":"SIN_REGISTRO";
}
export function localDateTime(date:Date|null|undefined):string{
 if(!date)return "—";
 return new Intl.DateTimeFormat("es-PE",{timeZone:"America/Lima",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(date);
}
export function durationMinutes(start:Date|null|undefined,end:Date|null|undefined):number|null{
 return start&&end?Math.max(0,Math.round((end.getTime()-start.getTime())/60000)):null;
}
