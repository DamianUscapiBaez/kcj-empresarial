/** Reglas puras del circuito de entrega y devolución de las unidades KCJ. */
export type EstadoFisicoCustodia="CONFORME"|"OBSERVADO"|"NO_CONFORME";
export interface ItemEntrega {code:string;label:string;quantity:number;condition:string;serial?:string|null;}
export interface ItemRecepcion {code:string;quantity:number;damaged:number;condition:string;notes:string;}
export function numeroEnteroSeguro(value:number,min=0,max=10000000):number{
 if(!Number.isSafeInteger(value)||value<min||value>max)throw new Error("Cantidad o kilometraje fuera del rango permitido");
 return value;
}
export function validarDatosActa(km:number,combustible:number):void{
 numeroEnteroSeguro(km);numeroEnteroSeguro(combustible,0,100);
}
export function compararInventarios(entrega:ItemEntrega[],recibido:ItemRecepcion[]){
 if(!entrega.length)throw new Error("Se necesita inventario de equipamiento antes de registrar la entrega");
 const originales=new Map(entrega.map(x=>[x.code,x]));
 if(originales.size!==entrega.length)throw new Error("Inventario original duplicado");
 if(recibido.length!==entrega.length||new Set(recibido.map(x=>x.code)).size!==recibido.length)throw new Error("La recepción debe verificar todos los elementos de la entrega una sola vez");
 return recibido.map(r=>{
  const prev=originales.get(r.code);if(!prev)throw new Error("Componente ajeno al inventario entregado");
  numeroEnteroSeguro(r.quantity,0,10000);numeroEnteroSeguro(r.damaged,0,r.quantity);
  if(!["CONFORME","OBSERVADO","NO_CONFORME"].includes(r.condition))throw new Error("Condición de devolución inválida");
  const discrepancy=r.quantity!==prev.quantity||r.damaged>0||r.condition!=="CONFORME";
  if(discrepancy&&r.notes.trim().length<5)throw new Error(`El componente ${prev.label} requiere observación por diferencia o daño`);
  return {itemCode:prev.code,label:prev.label,serial:prev.serial??null,expectedQuantity:prev.quantity,actualQuantity:r.quantity,damagedQuantity:r.damaged,condition:r.condition,notes:r.notes.trim()||null,discrepancy};
 });
}
export function validarLiberacionCustodia(pendientes:number,ordenesAbiertas:number,casosCriticos:number):void{
 if(pendientes>0)throw new Error("La recepción tiene diferencias sin resolución documentada");
 if(ordenesAbiertas>0)throw new Error("Existen órdenes de mantenimiento sin liberar");
 if(casosCriticos>0)throw new Error("Existen restricciones críticas de SSOMA sin cerrar");
}
