/** Identificación estable de una única cuenta Administradora Principal, sin usar nombres o roles como sustitutos. */
export const ADMIN_PRINCIPAL_SINGLETON = "PRIMARY" as const;
/** Control de dominio: la cuenta protegida no se administra desde el Centro de Control. */
export function bloquearCambioCuentaPrincipal(protectedUserId:string|null|undefined, targetUserId:string):void{
 if(protectedUserId && protectedUserId === targetUserId)
  throw new Error("La cuenta Administradora Principal está protegida: ningún administrador puede modificarla desde Centro de Control. La recuperación requiere el procedimiento técnico autorizado.");
}
export function esCuentaPrincipal(protectedUserId:string|null|undefined, targetUserId:string):boolean{
 return Boolean(protectedUserId && protectedUserId===targetUserId);
}
