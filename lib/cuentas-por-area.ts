import {identificacionUniforme} from "./normalizacion-datos.ts";
import {tieneAreaConductor,type AreasColaborador} from "./acceso-conductor-laboral.ts";
/** Roles técnicos derivados de las áreas de trabajo: NO se preguntan otra vez al crear la ficha. */
const AREA_ROL:Record<string,string>={
 "operaciones":"OPERACIONES", "mantenimiento":"MANTENIMIENTO", "recursos humanos":"RRHH",
 "ssoma":"SSOMA", "salud ocupacional":"SALUD", "gerencia":"GERENCIA",
 // TI, Administración y áreas personalizadas NO reciben privilegios ADMIN automáticamente.
 "tecnología de la información":"COLABORADOR", "administración":"COLABORADOR",
};
export function dniCuentaInicial(documento:string):string{
 const dni=documento.trim();
 if(!/^\d{8}$/.test(dni))throw new Error("Para crear cuenta automática se requiere DNI de 8 dígitos. Los otros documentos necesitan alta administrativa verificada.");
 return dni; // Texto para preservar ceros iniciales; no convertir a número.
}
export function nombreNormalizado(value:string):string{
 return identificacionUniforme(value);
}
export function rolesDesdeAreas(areas:AreasColaborador):{principal:string;adicionales:string[]}{
 const administrativas=[areas.area,areas.secondaryArea].filter((x):x is string=>Boolean(x)&&x!.trim().toLocaleLowerCase("es-PE")!=="conductor");
 const inicial=administrativas.map(x=>AREA_ROL[x.trim().toLocaleLowerCase("es-PE")]??"COLABORADOR");
 const principal=inicial[0]??"CONDUCTOR";
 const adicionales=[...new Set([...inicial.slice(1),...(tieneAreaConductor(areas)?["CONDUCTOR"]:[])])].filter(x=>x!==principal);
 return {principal,adicionales};
}
export function nombreEsPosibleDuplicado(a:string,b:string):boolean{
 return nombreNormalizado(a).toLocaleLowerCase("es-PE")===nombreNormalizado(b).toLocaleLowerCase("es-PE");
}
