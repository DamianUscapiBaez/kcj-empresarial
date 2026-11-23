/** Reglas puras del portal Propietarios; no concede permisos administrativos. */
export function loginPropietario(documento:string):string {
 const normalizado=documento.trim().toUpperCase().replace(/\s+/g,"");
 if(!/^[A-Z0-9-]{6,20}$/.test(normalizado))throw new Error("Documento del propietario inválido para crear su cuenta. Corrige la ficha primero.");
 return `prop-${normalizado.toLowerCase()}`;
}
export function propietarioPuedeVerUnidad(ownerId:string|null|undefined,vehicleOwnerId:string|null|undefined):boolean {
 return Boolean(ownerId && vehicleOwnerId && ownerId===vehicleOwnerId);
}
export function permitirVinculacion(actual:string|null|undefined,nuevo:string):void {
 if(!nuevo)throw new Error("Selecciona un propietario registrado.");
 if(actual===nuevo)throw new Error("Esta unidad ya pertenece al propietario seleccionado.");
 if(actual)throw new Error("La unidad ya está vinculada a otro propietario. Primero revisa y documenta su desvinculación.");
}
export function descripcionEstadoDocumento(fecha:Date|null|undefined,ahora:Date=new Date()):string {
 if(!fecha)return "Sin vencimiento registrado";
 const dias=Math.ceil((fecha.getTime()-ahora.getTime())/86_400_000);
 return dias<0?"Vencido":dias<=30?"Por vencer":"Vigente";
}
