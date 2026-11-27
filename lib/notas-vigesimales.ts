/** Adaptador de compatibilidad: la BD histórica conserva enteros 0–100. */
export function notaVigesimal(score:number|null|undefined):number|null {
 if(score==null)return null;
 if(!Number.isInteger(score)||score<0||score>100)throw new Error("Calificación histórica fuera de rango");
 return score/5;
}
export function notaVisible(score:number|null|undefined):string {
 const n=notaVigesimal(score);return n===null?"Pendiente":`${Number.isInteger(n)?String(n).padStart(2,"0"):n.toFixed(1)}/20`;
}
export function umbralHistorico(nota:number):number {
 if(!Number.isFinite(nota)||nota<0||nota>20||Math.abs(nota*5-Math.round(nota*5))>1e-8)throw new Error("Nota mínima inválida: 0 a 20 en pasos de 0.2");
 return Math.round(nota*5);
}
/** Regla para el futuro módulo de charlas; no registra asistencia. */
export function notaCharla(aciertos:number):number {
 if(!Number.isInteger(aciertos)||aciertos<0||aciertos>2)throw new Error("Se requieren de cero a dos aciertos");
 return aciertos*10;
}
