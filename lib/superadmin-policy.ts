/** Reglas del Superadministrador. La autoridad administrativa no sustituye firmas técnicas. */
export const ROLES_KCJ = ["COLABORADOR","ADMIN","GERENCIA","OPERACIONES","JEFE_OPERACIONES","SSOMA","MANTENIMIENTO","RRHH","SALUD","HOMOLOGACION","INSTRUCTOR","ALMACEN","CONDUCTOR","PROPIETARIO"] as const;
export type RolKCJ = typeof ROLES_KCJ[number];
export function esRolKCJ(value:string):value is RolKCJ {return (ROLES_KCJ as readonly string[]).includes(value);}
export function validarCambioRolPrincipal(actorId:string,targetId:string,rolAnterior:RolKCJ,nuevoRol:string,adminsActivos:number){
 if(!esRolKCJ(nuevoRol))throw new Error("Función principal no reconocida");
 if(actorId===targetId&&rolAnterior!==nuevoRol)throw new Error("No puedes cambiar tu propia función principal de ADMIN");
 if(rolAnterior==="ADMIN"&&nuevoRol!=="ADMIN"&&adminsActivos<=1)throw new Error("Debe permanecer al menos una cuenta ADMIN activa");
 return nuevoRol;
}
export function validarBajaAdministrativa(actorId:string,targetId:string,rol:RolKCJ,adminsActivos:number){
 if(actorId===targetId)throw new Error("No puedes desactivar tu propia cuenta");
 if(rol==="ADMIN"&&adminsActivos<=1)throw new Error("No puede desactivarse el último ADMIN activo");
}
export function validarVinculosRol(rol:RolKCJ,workerId:string|null,ownerId:string|null){
 if(rol==="CONDUCTOR"&&!workerId)throw new Error("Conductor requiere una ficha de trabajador vinculada");
 if(rol==="PROPIETARIO"&&!ownerId)throw new Error("Propietario vehicular requiere un propietario vinculado");
}
export function validacionReactivacion(workerVinculado:boolean,workerActivo:boolean,cuentaActiva:boolean){
 if(cuentaActiva)throw new Error("La cuenta ya está activa");
 if(workerVinculado&&!workerActivo)throw new Error("La ficha laboral está inactiva. Primero corresponde reactivarla en Personal");
}
/** Para cambios críticos de usuarios siempre debe existir una justificación auditable. */
export function motivoAdmin(value:string){const v=value.trim();if(v.length<10||v.length>500)throw new Error("Indica un motivo de 10 a 500 caracteres");return v;}
