import type {Role} from "@prisma/client";
export interface UserRoles {role:Role;grants?:{role:Role;revokedAt?:Date|null}[];}
export function rolesActivos(user:UserRoles):Role[]{return [...new Set([user.role,...(user.grants??[]).filter(g=>!g.revokedAt).map(g=>g.role)])];}
export function tieneRol(user:UserRoles,...roles:Role[]):boolean{return rolesActivos(user).some(r=>roles.includes(r));}
