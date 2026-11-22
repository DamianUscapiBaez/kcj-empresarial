import type {Role} from "@prisma/client";

/** Vistas de trabajo, NO roles adicionales ni nuevas identidades. */
export type PanelKCJ="administrativo"|"conductor";
type CuentaConRoles={role:Role;grants?:{role:Role;revokedAt?:Date|null}[]};

export function rolesHabilitados(user:CuentaConRoles):Role[]{
 return [...new Set([user.role,...(user.grants??[]).filter(g=>!g.revokedAt).map(g=>g.role)])];
}
/** El propietario conserva su vista de gestión; nunca se le asigna por ello CONDUCTOR. */
export function panelesDisponibles(user:CuentaConRoles):PanelKCJ[]{
 const roles=rolesHabilitados(user);
 return [
  ...(roles.some(r=>r!=="CONDUCTOR")?["administrativo" as const]:[]),
  ...(roles.includes("CONDUCTOR")?["conductor" as const]:[]),
 ];
}
export function puedeSeleccionarPanel(user:CuentaConRoles,panel:string):panel is PanelKCJ {
 return (panel==="administrativo"||panel==="conductor")&&panelesDisponibles(user).includes(panel);
}
export function destinoPanel(panel:PanelKCJ):string {
 return panel==="conductor"?"/dashboard/connect":"/dashboard";
}
/** Filtra la navegación: la selección no concede ni revoca roles. */
export function rolesParaPanel(user:CuentaConRoles,panel:PanelKCJ):Role[]{
 const roles=rolesHabilitados(user);
 return panel==="conductor"?roles.filter(r=>r==="CONDUCTOR"):roles.filter(r=>r!=="CONDUCTOR");
}
