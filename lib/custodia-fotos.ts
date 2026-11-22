/** Validación pura de las fotos originales que acompañan al registro de recepción. */
export const MAX_FOTOS_CUSTODIA = 4;
export const MAX_FOTOS_ACTA = 80;
export type ItemFotoRecepcion = {itemCode:string;label:string;damagedQuantity:number;condition:string};

export function leerFotosRecepcion(form:FormData,items:ItemFotoRecepcion[]):Map<string,string[]> {
 const codes=new Set(items.map(i=>i.itemCode));
 if(codes.size!==items.length)throw new Error("Códigos de inventario duplicados");
 for(const key of form.keys()){
  if(key.startsWith("photos_")&&!codes.has(key.slice("photos_".length)))throw new Error("El formulario contiene fotos de un componente ajeno a la entrega");
 }
 const all:string[]=[];
 const found=new Map<string,string[]>();
 for(const i of items){
  const values=form.getAll(`photos_${i.itemCode}`);
  if(values.length>MAX_FOTOS_CUSTODIA)throw new Error(`${i.label}: máximo ${MAX_FOTOS_CUSTODIA} fotografías`);
  const keys=values.map(v=>{
   if(typeof v!=="string"||v.length<8||v.length>400||v.trim()!==v)throw new Error("Clave de foto inválida");
   return v;
  });
  if((i.damagedQuantity>0||i.condition!=="CONFORME")&&keys.length===0){
   throw new Error(`${i.label}: adjunta una foto del daño o condición observada`);
  }
  found.set(i.itemCode,keys);all.push(...keys);
 }
 if(all.length>MAX_FOTOS_ACTA)throw new Error("La recepción supera la cantidad de fotografías permitida");
 if(new Set(all).size!==all.length)throw new Error("Una fotografía no puede asociarse a varios componentes de una misma acta");
 return found;
}

export function validarActivosFotos(
 keys:string[],
 activos:Array<{key:string;purpose:string;uploadedBy:string;verifiedAt:Date|null;contentType:string}>,
 actorId:string
):void {
 if(!keys.length)return;
 const porKey=new Map(activos.map(a=>[a.key,a]));
 for(const key of keys){
  const a=porKey.get(key);
  if(!a||a.purpose!=="CUSTODIA"||a.uploadedBy!==actorId||!a.verifiedAt||!["image/jpeg","image/png","image/webp"].includes(a.contentType)){
   throw new Error("Una fotografía no está verificada, no es imagen o no pertenece al operador de esta recepción");
  }
 }
}
