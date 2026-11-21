import type {Role} from "@prisma/client";
import {modules, canAccess, type ModuleSlug} from "@/lib/modulos";

// La navegación representa responsabilidades, NO departamentos nuevos.
// Los 17 módulos funcionales se conservan con sus rutas y registros originales.
const sections = [
 {title:"Operaciones", slugs:["operaciones","roster","tareo","flota","homologacion","custodia"]},
 {title:"Personas", slugs:["personal","rrhh","salud"]},
 {title:"Seguridad y mantenimiento", slugs:["ssoma","mantenimiento"]},
 {title:"Herramientas compartidas", slugs:["almacen","aula","comunicaciones","reportes"]},
 {title:"Portales", slugs:["connect","propietarios"]},
 {title:"Administración de plataforma", slugs:["acceso"]},
] as const satisfies readonly {title:string;slugs:readonly ModuleSlug[]}[];

export function navigationForRole(role:Role){
 return sections.map(section=>({
  title:section.title,
  modules:section.slugs.filter(slug=>canAccess(role,slug)).map(slug=>modules.find(m=>m.slug===slug)!),
 })).filter(section=>section.modules.length>0);
}
