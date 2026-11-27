/** Reglas puras: todos los valores de formularios se validan de nuevo en servidor. */
export const SEVERIDADES_SSOMA=["BAJA","MEDIA","ALTA","CRITICA"] as const;
export const MOVIMIENTOS_STOCK=["INGRESO","SALIDA"] as const;
const ROLES_PERSONAL=["COLABORADOR","ADMIN","GERENCIA","OPERACIONES","JEFE_OPERACIONES","SSOMA","MANTENIMIENTO","RRHH","SALUD","HOMOLOGACION","INSTRUCTOR","ALMACEN","CONDUCTOR"] as const;

export function severidadSSOMA(value:string):string {
 if(!(SEVERIDADES_SSOMA as readonly string[]).includes(value))throw new Error("La severidad SSOMA no es válida");
 return value;
}
export function deltaInventario(direction:string,quantity:number):number {
 if(!(MOVIMIENTOS_STOCK as readonly string[]).includes(direction))throw new Error("Tipo de movimiento no reconocido: utilice ingreso o salida");
 if(!Number.isSafeInteger(quantity)||quantity<1||quantity>100000)throw new Error("La cantidad debe ser un número entero positivo de hasta 100000 unidades");
 return direction==="SALIDA"?-quantity:quantity;
}
export function rolAltaColaborador(value:string):typeof ROLES_PERSONAL[number]{
 if(!(ROLES_PERSONAL as readonly string[]).includes(value))throw new Error("Elija un rol de trabajador válido. Los propietarios requieren registro independiente");
 return value as typeof ROLES_PERSONAL[number];
}
export function validarAltaConAcceso(crearAcceso:boolean,actorEsAdmin:boolean):void{
 if(crearAcceso&&!actorEsAdmin)throw new Error("La creación simultánea de una cuenta requiere autorización de ADMIN");
}

/** En el panel Conductor una cuenta dual solo opera servicios de su propia ficha. */
export function autorizarOperacionServicio(panel:"administrativo"|"conductor"|`area:${string}`,actorWorkerId:string|null,serviceWorkerId:string|null,rolOperaciones:boolean):void{
 if(panel==="conductor"){
  if(!actorWorkerId||serviceWorkerId!==actorWorkerId)throw new Error("El conductor solo puede gestionar sus servicios asignados");
 }else if(!rolOperaciones){throw new Error("Solo Operaciones puede gestionar servicios ajenos desde el panel administrativo");}
}

/** Odómetro, año de fabricación e inventario entero se controlan antes de escribir en Prisma. */
export function enteroOperativo(n:number,min:number,max:number):number{
 if(!Number.isSafeInteger(n)||n<min||n>max)throw new Error(`Se requiere un número entero entre ${min} y ${max}`);
 return n;
}
