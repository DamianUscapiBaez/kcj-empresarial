/** Política de acceso KCJ: clave asignada hasta cambio voluntario o restablecimiento autorizado. */
export const MIN_LONGITUD_CLAVE=16;
export const MAX_LONGITUD_CLAVE=256;
export function validarClaveAsignada(clave:string, confirmacion:string):string {
 if(clave.length<MIN_LONGITUD_CLAVE||clave.length>MAX_LONGITUD_CLAVE)throw new Error("La contraseña debe tener entre 16 y 256 caracteres.");
 if(clave!==confirmacion)throw new Error("La confirmación de la contraseña no coincide.");
 return clave;
}
export function validarRestablecimientoAdmin(adminId:string, cuentaId:string, activo:boolean):void {
 if(adminId===cuentaId)throw new Error("Para cambiar tu propia contraseña, utiliza 'Cambiar mi contraseña' e indica la clave actual.");
 if(!activo)throw new Error("No se puede cambiar la contraseña de una cuenta inactiva.");
}
