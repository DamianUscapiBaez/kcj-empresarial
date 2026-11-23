import type {Role} from "@prisma/client";

/** Una sola cuenta y sesión; el panel elegido restringe, no aumenta, permisos. */
export type PanelKCJ="administrativo"|"conductor"|`area:${Role}`;
type CuentaConRoles={role:Role;grants?:{role:Role;revokedAt?:Date|null}[]};
export function rolesHabilitados(user:CuentaConRoles):Role[]{
 return [...new Set([user.role,...(user.grants??[]).filter(g=>!g.revokedAt).map(g=>g.role)])];
}
export const TITULOS_AREA:Partial<Record<Role,string>>={GERENCIA:"Gerencia",RRHH:"Recursos Humanos",OPERACIONES:"Operaciones",JEFE_OPERACIONES:"Jefatura de Operaciones",SSOMA:"SSOMA",MANTENIMIENTO:"Mantenimiento",SALUD:"Salud Ocupacional",INSTRUCTOR:"Capacitación",ALMACEN:"Almacén y herramientas",HOMOLOGACION:"Homologación del personal",COLABORADOR:"Administrativo"};
export function nombrePanel(panel:PanelKCJ):string{
 if(panel==="administrativo")return "Administrativo";
 if(panel==="conductor")return "Conductor · KCJ CONNECT";
 const role=panel.slice(5) as Role;
 return TITULOS_AREA[role]??role.replaceAll("_"," ");
}
/** Una sola área ingresa sin selector; dos administrativas (Gerencia + RRHH) se eligen. */
export function panelesDisponibles(user:CuentaConRoles):PanelKCJ[]{
 const roles=rolesHabilitados(user);
 const admin=roles.filter(r=>r!=="CONDUCTOR");
 // Homologación, Instructor y Almacén son permisos/funciones, NO áreas de trabajo.
 const areasAdministrativas=admin.filter(r=>!["HOMOLOGACION","ALMACEN","INSTRUCTOR"].includes(r));
 const conductor=roles.includes("CONDUCTOR");
 // ADMIN conserva Centro de Control: no se puede crear un panel sin permisos de ADMIN.
 if(areasAdministrativas.length>1&&!admin.includes("ADMIN"))return [
  ...areasAdministrativas.map(r=>`area:${r}` as const),...(conductor?["conductor" as const]:[])
 ];
 return [...(admin.length?["administrativo" as const]:[]),...(conductor?["conductor" as const]:[])];
}
export function puedeSeleccionarPanel(user:CuentaConRoles,panel:string):panel is PanelKCJ {
 return panelesDisponibles(user).includes(panel as PanelKCJ);
}
export function destinoPanel(panel:PanelKCJ):string {
 return panel==="conductor"?"/dashboard/connect":"/dashboard";
}
/** Las áreas elegidas se aíslan también en el servidor, no solo en el menú. */
export function rolesParaPanel(user:CuentaConRoles,panel:PanelKCJ):Role[]{
 const roles=rolesHabilitados(user);
 if(panel==="conductor")return roles.filter(r=>r==="CONDUCTOR");
 if(panel.startsWith("area:")){
  const elegido=panel.slice(5) as Role;
  return roles.includes(elegido)&&elegido!=="CONDUCTOR"?[elegido]:[];
 }
 return roles.filter(r=>r!=="CONDUCTOR");
}
