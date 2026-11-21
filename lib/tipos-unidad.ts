/** Catálogo oficial de KCJ CONTROL para registrar nuevas unidades.
 *  Se conserva Vehicle.type como String para no alterar fichas históricas.
 */
export const TIPOS_UNIDAD_KCJ = [
  {value:"CAMIONETA", label:"Camioneta"},
  {value:"MICROBUS", label:"Microbús"},
  {value:"MINIBUS", label:"Minibús"},
  {value:"OMNIBUS", label:"Ómnibus"},
] as const;

export type TipoUnidadKCJ = (typeof TIPOS_UNIDAD_KCJ)[number]["value"];

/** Validar nuevamente en el servidor: el selector HTML se puede alterar. */
export function validarTipoUnidadKCJ(value: unknown): TipoUnidadKCJ {
  if (typeof value !== "string" || !TIPOS_UNIDAD_KCJ.some(tipo => tipo.value === value)) {
    throw new Error("Tipo de unidad no válido. Seleccione Camioneta, Microbús, Minibús u Ómnibus.");
  }
  return value as TipoUnidadKCJ;
}
