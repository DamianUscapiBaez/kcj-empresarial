/** Diagnóstico seguro para la UI (nunca mostrar mensajes crudos de Prisma/SQL). */
export type EstadoErrorColaboradores={
 tipo:"estructura"|"conexion"|"acceso"|"desconocido";
 codigo:string;
 mensaje:string;
};

/** Lista conservadora de códigos: no se afirma una causa sin haberla verificado. */
export function diagnosticarErrorColaboradores(error:unknown):EstadoErrorColaboradores {
 const value=error&&typeof error==="object"&&"code" in error?(error as {code?:unknown}).code:undefined;
 const codigo=typeof value==="string"&&/^P\d{4}$/.test(value)?value:"SIN_CODIGO";
 if(codigo==="P2021"||codigo==="P2022")return {
  tipo:"estructura",codigo,
  mensaje:"Falta una tabla o columna necesaria en PostgreSQL. TI debe comprobar las migraciones de Colaboradores sobre una copia de ensayo y aplicar los cambios pendientes de forma controlada.",
 };
 if(["P1001","P1002","P1003","P1017"].includes(codigo))return {
  tipo:"conexion",codigo,
  mensaje:"No se pudo completar la consulta a PostgreSQL. TI debe revisar la conectividad y los registros del servidor de Vercel; los datos registrados no se consideran vacíos.",
 };
 if(["P1000","P1010"].includes(codigo))return {
  tipo:"acceso",codigo,
  mensaje:"PostgreSQL rechazó el acceso a la consulta. TI debe revisar las credenciales de servicio y los permisos de la base de datos sin publicar secretos.",
 };
 return {
  tipo:"desconocido",codigo,
  mensaje:"El servidor no completó la lectura de Colaboradores. TI debe consultar el registro del despliegue para identificar la causa, sin modificar los registros.",
 };
}
