import type {Role} from "@prisma/client";
import {modules, canAccess, type ModuleSlug} from "@/lib/modulos";

// PROPUESTA B APROBADA: grupos de NAVEGACION, no áreas organizativas ni permisos nuevos.
// Se conservan los 18 slugs originales y dos simulacros, las rutas, los modelos de datos y las autorizaciones existentes.
const sections = [
 {title:"Servicios y jornadas", slugs:["operaciones","roster","tareo"], pausas:true},
 {title:"Unidades y habilitaciones", slugs:["flota","mantenimiento","custodia","propietarios"], pausas:false},
 {title:"Trabajadores y formación", slugs:["personal","homologacion","rrhh","salud","aula","simulacros-tecsup","simulacros-mmg"], pausas:false},
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
 homologacion:"Homologación de personal",
};

const pauseRoles:readonly Role[]=["ADMIN","GERENCIA","OPERACIONES","JEFE_OPERACIONES","SSOMA","SALUD"];
export function puedeConsultarPausas(role:Role|Role[]):boolean{
 const roles=Array.isArray(role)?role:[role];
 return roles.some(r=>pauseRoles.includes(r));
}

const prioridad:Partial<Record<Role,readonly ModuleSlug[]>>={
 OPERACIONES:["operaciones","roster","flota","tareo","homologacion","personal"],
 JEFE_OPERACIONES:["operaciones","roster","flota","tareo","reportes"],
 GERENCIA:["reportes","operaciones","rrhh","personal","flota"],
 RRHH:["personal","rrhh","tareo","roster","almacen"],
 SSOMA:["ssoma","flota","aula","reportes"],
 MANTENIMIENTO:["mantenimiento","flota","almacen"],
 SALUD:["salud","personal","aula"],
 ADMIN:["acceso","personal","operaciones","flota","reportes"]
};
export function navigationForRole(role:Role|Role[]){
 const principal=(Array.isArray(role)?role[0]:role) as Role;
 const favorito=prioridad[principal]??[];
 const rank=(slug:ModuleSlug)=>{const i=favorito.indexOf(slug);return i<0?100:i;};
 return sections.map(section=>({
  title:section.title,
  showPausas:section.pausas&&puedeConsultarPausas(role),
  modules:section.slugs.filter(slug=>canAccess(role,slug)).sort((a,b)=>rank(a)-rank(b)).map(slug=>{
   const m=modules.find(item=>item.slug===slug)!;
   return {...m,title:labelsNavegacion[slug]??m.title};
  }),
 })).filter(section=>section.modules.length>0||section.showPausas).sort((a,b)=>Math.min(...a.modules.map(m=>rank(m.slug)),101)-Math.min(...b.modules.map(m=>rank(m.slug)),101));
}
