import type {Role} from "@prisma/client";
import {modules, canAccess, type ModuleSlug} from "@/lib/modulos";

// PROPUESTA B APROBADA: grupos de NAVEGACION, no áreas organizativas ni permisos nuevos.
// Se conservan los 18 slugs originales y dos simulacros, las rutas, los modelos de datos y las autorizaciones existentes.
const sections = [
 {title:"Servicios y jornadas", slugs:["operaciones","roster","tareo"], pausas:true},
 {title:"Unidades y habilitaciones", slugs:["flota","mantenimiento","homologacion","custodia","propietarios"], pausas:false},
 {title:"Trabajadores y formación", slugs:["personal","rrhh","salud","aula","simulacros-tecsup","simulacros-mmg"], pausas:false},
 {title:"Seguridad y cumplimiento", slugs:["ssoma"], pausas:false},
 {title:"Recursos corporativos", slugs:["almacen","comunicaciones"], pausas:false},
 {title:"Análisis y reportes", slugs:["reportes"], pausas:false},
 {title:"Accesos y configuración", slugs:["connect","acceso"], pausas:false},
] as const satisfies readonly {title:string;slugs:readonly ModuleSlug[];pausas:boolean}[];

// Etiquetas solo de presentación: no cambiar slugs, enums de roles ni módulos de dominio.
export const labelsNavegacion:Partial<Record<ModuleSlug,string>>={
 acceso:"Centro de Control · Usuarios",
 operaciones:"Servicios y asignaciones",
 roster:"ROSTER · Guardias y descansos",
 tareo:"Tareo · Horas trabajadas",
 homologacion:"Homologaciones externas",
};

const pauseRoles:readonly Role[]=["ADMIN","GERENCIA","OPERACIONES","JEFE_OPERACIONES","SSOMA","SALUD"];
export function puedeConsultarPausas(role:Role|Role[]):boolean{
 const roles=Array.isArray(role)?role:[role];
 return roles.some(r=>pauseRoles.includes(r));
}

export function navigationForRole(role:Role|Role[]){
 return sections.map(section=>({
  title:section.title,
  showPausas:section.pausas&&puedeConsultarPausas(role),
  modules:section.slugs.filter(slug=>canAccess(role,slug)).map(slug=>{
   const m=modules.find(item=>item.slug===slug)!;
   return {...m,title:labelsNavegacion[slug]??m.title};
  }),
 })).filter(section=>section.modules.length>0||section.showPausas);
}
