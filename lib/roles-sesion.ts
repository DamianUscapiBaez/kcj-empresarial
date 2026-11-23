import "server-only";
import {panelActual} from "@/lib/panel-sesion";
import {rolesParaPanel} from "@/lib/paneles-kcj";
import type {Role} from "@prisma/client";
/** Permisos efectivos en el panel activo: los roles de otra área no se mezclan. */
export async function rolesSesion(user:{role:Role;grants?:{role:Role;revokedAt?:Date|null}[]}):Promise<Role[]>{
 const panel=await panelActual(user);
 return panel?rolesParaPanel(user,panel):[];
}
