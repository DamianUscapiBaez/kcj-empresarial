/** La licencia particular es un dato de cualquier colaborador; no le otorga el rol CONDUCTOR. */
export const CATEGORIAS_LICENCIA_KCJ=["A-I","A-IIa","A-IIb","A-IIIa","A-IIIb","A-IIIc","B-I","B-IIa","B-IIb","B-IIc"] as const;
export function validarContactoCelular(value:string|null):string|null{
 if(!value)return null;
 const numero=value.trim();
 if(!/^\+?[0-9()\s-]{7,22}$/.test(numero)||numero.replace(/\D/g,"").length<7)throw new Error("Celular inválido. Ingresa un número de contacto con sus dígitos y, si corresponde, el prefijo del país.");
 return numero;
}
export function validarLicenciaColaborador(numero:string|null,categoria:string|null,vencimiento:Date|null,emision:Date|null):void{
 if(!numero){if(categoria||vencimiento||emision)throw new Error("Indica el número de licencia o deja todos los campos de licencia vacíos.");return;}
 if(!categoria||!CATEGORIAS_LICENCIA_KCJ.some(c=>c===categoria))throw new Error("Selecciona la categoría de la licencia registrada.");
 if(!vencimiento)throw new Error("Indica el vencimiento de la licencia registrada.");
 if(emision&&emision>vencimiento)throw new Error("La emisión de la licencia no puede ser posterior al vencimiento.");
}
