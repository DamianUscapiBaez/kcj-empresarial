import {createHash} from "node:crypto";

export type LadoFirmaCustodia = "ENTREGA" | "RECIBE";
export function validarLadoFirma(lado:string):asserts lado is LadoFirmaCustodia {
 if(lado!=="ENTREGA"&&lado!=="RECIBE")throw new Error("El lado de la firma no es válido");
}

type LineaActa = {itemCode:string;label:string;serial:string|null;expectedQuantity:number;actualQuantity:number;damagedQuantity:number;condition:string;notes:string|null;discrepancy:boolean;photos?:{evidenceKey:string}[]};
type ActaFirma = {contentVersion?:number;id:string;vehicleId:string;kind:string;party:string;location:string|null;senderName:string|null;receiverName:string|null;condition:string;odometerKm:number|null;fuelPercent:number|null;at:Date;evidenceKey?:string|null;relatedDeliveryId?:string|null;items:LineaActa[]};
/** Fija el contenido original aceptado: nunca incluye resoluciones posteriores de diferencias. */
export function huellaActaCustodia(acta:ActaFirma):string {
 const version=acta.contentVersion??1;
 if(version!==1&&version!==2&&version!==3)throw new Error("Versión de acta desconocida; requiere revisión de TI");
 // Para v1 conservar exactamente la serialización histórica de la Fase 02.2.
 const lines=acta.items.map(i=>({code:i.itemCode,label:i.label,serial:i.serial,expected:i.expectedQuantity,actual:i.actualQuantity,damaged:i.damagedQuantity,condition:i.condition,notes:i.notes,discrepancy:i.discrepancy})).sort((a,b)=>a.code.localeCompare(b.code));
 const base={id:acta.id,vehicleId:acta.vehicleId,kind:acta.kind,party:acta.party,location:acta.location,senderName:acta.senderName,receiverName:acta.receiverName,condition:acta.condition,odometerKm:acta.odometerKm,fuelPercent:acta.fuelPercent,at:acta.at.toISOString()};
 if(version===1){
  const snapshot={version:1,...base,items:lines};
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
 }
 // v2: además de los campos originales, fijar los archivos fotográficos por componente.
 // Así cambiar una foto o adjuntarla después de la firma modifica la huella.
 const photos=acta.items.map(i=>({code:i.itemCode,evidenceKeys:(i.photos??[]).map(p=>p.evidenceKey).sort()})).sort((a,b)=>a.code.localeCompare(b.code));
 const snapshot=version===2
  ? {version:2,...base,items:lines,photos}
  : {version:3,...base,items:lines,photos,evidenceKey:acta.evidenceKey??null,relatedDeliveryId:acta.relatedDeliveryId??null};
 return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}
export function nombreFirmante(acta:{senderName:string|null;receiverName:string|null},lado:LadoFirmaCustodia):string {
 const name=lado==="ENTREGA"?acta.senderName:acta.receiverName;
 if(!name||name.trim().length<3)throw new Error("El acta no identifica a esta persona; requiere regularización por Operaciones");
 return name.trim();
}
