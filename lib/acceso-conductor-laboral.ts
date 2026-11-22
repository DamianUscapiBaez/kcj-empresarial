/** El área Conductor es un trabajo propio de KCJ; KCJ CONNECT es su interfaz, no un área. */
export const AREA_CONDUCTOR_KCJ="Conductor";
export type AreasColaborador={area:string;secondaryArea:string|null};
export function tieneAreaConductor(areas:AreasColaborador):boolean{
 return [areas.area,areas.secondaryArea].some(v=>v?.trim().toLocaleLowerCase("es-PE")===AREA_CONDUCTOR_KCJ.toLocaleLowerCase("es-PE"));
}
/** Jamás usar un código de área como permiso administrativo. */
export function validarRolConductorEnFicha(rol:string,areas:AreasColaborador):void{
 if(rol==="CONDUCTOR"&&!tieneAreaConductor(areas))throw new Error("Para autorizar Conductor, la ficha debe tener asignada el área de trabajo Conductor.");
}
