/** Catálogo de referencia recibido de KCJ/Webcontrol. NO implica que todo sea obligatorio.
 * Operaciones decide la aplicabilidad por tipo de unidad y mina; fuente de aprobación externa.
 */
export const REQUISITOS_MINEROS_VEHICULARES = [
 {code:"JAULA_ANTIVUELCO",label:"Certificado de jaula y barra antivuelco"},
 {code:"INGRESO_TALLER",label:"Certificado de ingreso a taller homologado"},
 {code:"OPERATIVIDAD_INSITE",label:"Certificado de operatividad in site"},
 {code:"INSTALACION_GPS",label:"Certificado de instalación GPS"},
 {code:"TORQUEO",label:"Certificado de torqueo"},
 {code:"CHECKLIST_FINAL",label:"Checklist final de inspección general"},
 {code:"DESARROLLO_SOCIAL",label:"Desarrollo Social (si corresponde)"},
 {code:"MANTENIMIENTO_PREVENTIVO",label:"Mantenimiento preventivo"},
] as const;
export const ESTADOS_DOCUMENTO_MINERO=[
 {value:"PENDIENTE",label:"Pendiente de presentación"},
 {value:"EN_REVISION",label:"En revisión externa"},
 {value:"APROBADO",label:"Aprobado por entidad externa"},
 {value:"RECHAZADO",label:"Rechazado por entidad externa"},
 {value:"NO_APLICA",label:"No aplica (sustentar)"},
] as const;
export const DOCUMENTOS_VEHICULARES_GENERALES=[
 {value:"SOAT",label:"SOAT"},
 {value:"REVISION_TECNICA",label:"Revisión técnica vehicular"},
 {value:"POLIZA",label:"Póliza de seguro vehicular"},
 {value:"TARJETA_PROPIEDAD",label:"Tarjeta de propiedad"},
 {value:"TARJETA_CIRCULACION",label:"Tarjeta de circulación (si aplica)"},
 {value:"INSCRIPCION_VEHICULAR",label:"Partida de inscripción vehicular"},
 {value:"ALQUILER_TERCEROS",label:"Copia legalizada de alquiler a terceros (si aplica)"},
] as const;
export function requisitoMineroValido(kind:string){return REQUISITOS_MINEROS_VEHICULARES.some(x=>x.code===kind)}
export function estadoExternoValido(status:string){return ESTADOS_DOCUMENTO_MINERO.some(x=>x.value===status)}
export function documentoGeneralValido(kind:string){return DOCUMENTOS_VEHICULARES_GENERALES.some(x=>x.value===kind)}
export function validarHomologacionPersonal(kind:string, workerId:string,vehicleId?:string|null){
 if(!["CONDUCTOR_MINA","CURSO_EXTERNO"].includes(kind))throw new Error("Solo se registran certificados personales en Homologación de personal.");
 if(!workerId||vehicleId)throw new Error("La homologación de personal exige un colaborador y no admite unidades vehiculares.");
}
export function validarPaseMineroVehicular(kind:string,vehicleId:string,workerId?:string|null){
 if(kind!=="TARJETA_AMARILLA"||!vehicleId||workerId)throw new Error("Habilitación minera vehicular: seleccione la unidad; no vincule un trabajador.");
}
/** No inventar obligatoriedad ni aprobación externa. */
export function validarResultadoExterno(status:string,reference:string|null,evidenceKey:string|null,remarks:string|null){
 if(!estadoExternoValido(status))throw new Error("Estado de evaluación externa no válido.");
 if(["APROBADO","RECHAZADO"].includes(status)&&!reference&&!evidenceKey)throw new Error("Una decisión externa exige referencia del expediente o documento de evidencia.");
 if(status==="NO_APLICA"&&(!remarks||remarks.trim().length<8))throw new Error("Justifique por qué este requisito no aplica a la unidad.");
}
