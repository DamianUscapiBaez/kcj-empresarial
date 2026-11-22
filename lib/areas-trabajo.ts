/** Áreas laborales: datos de la ficha, NO roles ni autorizaciones del sistema. */
export const AREAS_INICIALES_KCJ = [
 "Operaciones", "SSOMA", "Salud Ocupacional", "Recursos Humanos",
 "Mantenimiento", "Gerencia", "Tecnología de la Información", "Conductor",
] as const;

export function validarAreasTrabajo(
 principal: string,
 secundaria: string | null | undefined,
 disponibles: readonly string[],
): {area:string; secondaryArea:string|null} {
 const area=principal.trim();
 const secondaryArea=(secundaria??"").trim()||null;
 if(!area||!disponibles.includes(area))throw new Error("Selecciona un área de trabajo principal del catálogo autorizado.");
 if(secondaryArea!==null&&!disponibles.includes(secondaryArea))throw new Error("La segunda área de trabajo no figura en el catálogo autorizado.");
 if(secondaryArea!==null&&area.toLocaleLowerCase("es-PE")===secondaryArea.toLocaleLowerCase("es-PE")){
  throw new Error("El área principal y la segunda área deben ser distintas.");
 }
 return {area,secondaryArea};
}

export function nombreNuevaArea(raw:string):string {
 const name=raw.trim().replace(/\s+/g," ");
 if(name.length<3||name.length>100)throw new Error("El nombre del área debe tener entre 3 y 100 caracteres.");
 if(/[<>\r\n]/.test(name))throw new Error("Nombre de área no válido.");
 return name;
}
