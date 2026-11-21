import type { Role } from "@prisma/client";
export const modules = [
 {slug:"acceso",title:"Acceso y usuarios",description:"Cuentas, permisos y auditoría"},
 {slug:"personal",title:"Personal",description:"Ficha laboral única"},
 {slug:"operaciones",title:"Operaciones",description:"Servicios y asignaciones"},
 {slug:"roster",title:"ROSTER",description:"Guardias y descansos"},
 {slug:"connect",title:"KCJ CONNECT",description:"Portal de conductores"},
 {slug:"flota",title:"Flota",description:"Vehículos y documentos"},
 {slug:"mantenimiento",title:"Mantenimiento",description:"OT y liberación técnica"},
 {slug:"ssoma",title:"SSOMA",description:"Reportes y acciones correctivas"},
 {slug:"homologacion",title:"Homologación",description:"Tarjeta Amarilla y habilitaciones"},
 {slug:"tareo",title:"Tareo general",description:"Horas reales y validación"},
 {slug:"aula",title:"Aula Virtual",description:"Cursos, exámenes y HHC"},
 {slug:"rrhh",title:"Recursos Humanos",description:"Contratos y expediente laboral"},
 {slug:"salud",title:"Salud Ocupacional",description:"Solo aptitud operativa"},
 {slug:"propietarios",title:"Propietarios",description:"Unidades vinculadas"},
 {slug:"comunicaciones",title:"Comunicaciones",description:"Avisos y confirmaciones"},
 {slug:"reportes",title:"Reportes y estadísticas",description:"Indicadores y auditoría"},
 {slug:"custodia",title:"Entrega y recepción",description:"Actas y custodia"},
 {slug:"almacen",title:"Almacén y herramientas",description:"Inventarios y movimientos"}
] as const;
export type ModuleSlug=typeof modules[number]["slug"];
export function isModuleSlug(x:string):x is ModuleSlug{return modules.some(m=>m.slug===x);}
const roles: Record<ModuleSlug,readonly Role[]> = {
 acceso:["ADMIN"], personal:["ADMIN","RRHH","OPERACIONES","JEFE_OPERACIONES","GERENCIA"],
 operaciones:["ADMIN","OPERACIONES","JEFE_OPERACIONES","GERENCIA"],roster:["ADMIN","OPERACIONES","JEFE_OPERACIONES","RRHH"],
 connect:["CONDUCTOR","ADMIN","OPERACIONES","JEFE_OPERACIONES"],flota:["ADMIN","OPERACIONES","JEFE_OPERACIONES","MANTENIMIENTO","SSOMA","GERENCIA","PROPIETARIO"],
 mantenimiento:["ADMIN","MANTENIMIENTO","OPERACIONES","JEFE_OPERACIONES","GERENCIA"],ssoma:["ADMIN","SSOMA","OPERACIONES","JEFE_OPERACIONES","GERENCIA"],
 homologacion:["ADMIN","HOMOLOGACION","OPERACIONES","JEFE_OPERACIONES","GERENCIA"],tareo:["ADMIN","RRHH","OPERACIONES","JEFE_OPERACIONES","GERENCIA"],
 aula:["ADMIN","INSTRUCTOR","SSOMA","SALUD","RRHH","OPERACIONES","JEFE_OPERACIONES","GERENCIA","CONDUCTOR"],
 rrhh:["ADMIN","RRHH","GERENCIA"],salud:["ADMIN","SALUD"],propietarios:["ADMIN","OPERACIONES","JEFE_OPERACIONES","PROPIETARIO"],
 comunicaciones:["ADMIN","GERENCIA","OPERACIONES","JEFE_OPERACIONES","SSOMA","CONDUCTOR","RRHH","SALUD","MANTENIMIENTO","HOMOLOGACION","INSTRUCTOR","ALMACEN","PROPIETARIO"],
 reportes:["ADMIN","GERENCIA","JEFE_OPERACIONES","SSOMA","RRHH"], custodia:["ADMIN","OPERACIONES","JEFE_OPERACIONES","MANTENIMIENTO"],
 almacen:["ADMIN","ALMACEN","OPERACIONES","JEFE_OPERACIONES","RRHH","MANTENIMIENTO","GERENCIA","SSOMA"]
};
export function canAccess(role:Role,slug:ModuleSlug):boolean{return roles[slug].includes(role);}
