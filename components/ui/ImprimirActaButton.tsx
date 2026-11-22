"use client";
/** No altera registros: abre el diálogo del navegador, que permite Guardar como PDF. */
export function ImprimirActaButton(){
 return <button type="button" className="btn" onClick={()=>window.print()}>Imprimir / guardar como PDF</button>;
}
