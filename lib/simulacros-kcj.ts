/** Simulacros internos KCJ: nunca acreditan homologación externa. */
export const TEMAS_TECSUP = [
 {code:"TEC_SSO_AMBIENTE", title:"INDUCCIÓN GENERAL DE SSO Y MEDIO AMBIENTE"},
 {code:"TEC_TAREAS_SEGURAS", title:"LB-IND-MANEJO DE TAREAS SEGURAS"},
 {code:"TEC_MATPEL", title:"LB-IND-MATERIALES PELIGROSOS MATPEL"},
 {code:"TEC_FATIGA", title:"LB-SSHE-FATIGA Y SOMNOLENCIA"},
 {code:"TEC_TORMENTAS", title:"LB-SSHE-TORMENTAS ELÉCTRICAS"},
 {code:"TEC_MANEJO_DEFENSIVO", title:"MANEJO DEFENSIVO-TEÓRICO"},
] as const;
export const TEMA_MMG = {code:"MMG_IZQUIERDA", title:"MMG – MANEJO A LA IZQUIERDA"} as const;
export const PRACTICO_TECSUP="TEC_PRACTICO_VIDEO" as const;
export const TIPOS_PRACTICOS = ["CAMIONETA","MICROBUS","MINIBUS","OMNIBUS"] as const;
export const TEMAS_SIMULACROS = [...TEMAS_TECSUP,TEMA_MMG] as const;
export type CodigoTema = typeof TEMAS_SIMULACROS[number]["code"];
export type CodigoMaterial = CodigoTema|typeof PRACTICO_TECSUP;
export function esTema(x:string):x is CodigoTema{return TEMAS_SIMULACROS.some(t=>t.code===x);}
export function esMaterial(x:string):x is CodigoMaterial{return esTema(x)||x===PRACTICO_TECSUP;}
export function esTemaDeModulo(code:string,modulo:"simulacros-tecsup"|"simulacros-mmg"){
 return modulo==="simulacros-tecsup"?TEMAS_TECSUP.some(t=>t.code===code):code===TEMA_MMG.code;
}
export const ROLES_LINEA_MANDO = ["GERENCIA","JEFE_OPERACIONES","OPERACIONES","SSOMA","MANTENIMIENTO","HOMOLOGACION","INSTRUCTOR"] as const;
export function puedePracticar(roles:readonly string[],tema:string):boolean{
 if(!esTema(tema))return false;
 if(tema===TEMA_MMG.code)return roles.includes("CONDUCTOR");
 return roles.includes("CONDUCTOR")||ROLES_LINEA_MANDO.some(r=>roles.includes(r));
}
export function esEditorSimulacros(roles:readonly string[]):boolean{return roles.includes("ADMIN")||roles.includes("INSTRUCTOR");}
export function validarRespuesta(textos:readonly string[],correcta:string){
 if(textos.length!==4||textos.some(t=>!t.trim())||!(["A","B","C","D"].includes(correcta)))throw new Error("Registra cuatro alternativas y selecciona exactamente una respuesta correcta");
}
export function calificarSimulacro(preguntas:readonly {id:string;correctOption:string}[],answers:Readonly<Record<string,string>>){
 if(!preguntas.length)throw new Error("Este simulacro aún no tiene preguntas");
 let aciertos=0;
 for(const q of preguntas){const r=answers[q.id];if(!["A","B","C","D"].includes(r))throw new Error("Responde todas las preguntas antes de finalizar");if(r===q.correctOption)aciertos++;}
 return {aciertos,total:preguntas.length,porcentaje:Math.round(100*aciertos/preguntas.length)};
}
