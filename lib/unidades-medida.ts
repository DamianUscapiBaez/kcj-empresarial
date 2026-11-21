/** Catálogo único para nuevas altas del inventario compartido KCJ.
 * El campo InventoryItem.unit permanece String: se preservan los registros antiguos.
 * Para ampliar las opciones se debe seguir el proceso de aprobación del catálogo.
 */
export const UNIDADES_MEDIDA_KCJ = [
  {value:"UND",label:"Unidad (UND)"},
  {value:"PAR",label:"Par (PAR)"},
  {value:"JGO",label:"Juego (JGO)"},
  {value:"L",label:"Litro (L)"},
  {value:"KG",label:"Kilogramo (KG)"},
  {value:"M",label:"Metro (M)"},
  {value:"CJA",label:"Caja (CJA)"},
  {value:"PQT",label:"Paquete (PQT)"},
  {value:"ROL",label:"Rollo (ROL)"},
] as const;

export type UnidadMedidaKCJ = (typeof UNIDADES_MEDIDA_KCJ)[number]["value"];

/** Nunca confiar únicamente en el <select> del navegador. */
export function validarUnidadMedidaKCJ(value: unknown): UnidadMedidaKCJ {
  if (typeof value !== "string" || !UNIDADES_MEDIDA_KCJ.some(unidad => unidad.value === value)) {
    throw new Error("Unidad de medida no válida. Selecciona una opción del catálogo autorizado de KCJ.");
  }
  return value as UnidadMedidaKCJ;
}
