/** Solo para campos de identificación expresamente seleccionados. Nunca para claves, áreas o narrativa. */
export function identificacionUniforme(value:string):string {
 return value.normalize('NFC').trim().replace(/\s+/gu,' ').toLocaleUpperCase('es-PE');
}
export function identificacionOpcional(value:string|null):string|null {
 return value===null?null:identificacionUniforme(value);
}
