/** Contrato de datos para la futura exportación CargaMasivaHH.xlsx.
 * Mantiene 12 y 12N separados internamente, ambos se exportan numéricamente como 12.
 * La conversión de códigos ajenos debe aprobarse por Operaciones: no se infieren horas.
 * NO genera todavía un archivo XLSX: la plantilla de la minera debe preservarse intacta.
 */
export type CodigoHH="12"|"12N"|"0";
export type RegistroHH={dni:string;roster:string;tipoPuesto:"PERSONAL OPERATIVO"|"ADMINISTRATIVOS";dias:Readonly<Record<number,CodigoHH>>};
function diasMes(year:number,month:number):number{
 if(!Number.isInteger(year)||year<2000||year>2100||!Number.isInteger(month)||month<1||month>12)throw new Error("Periodo inválido");
 return new Date(Date.UTC(year,month,0)).getUTCDate();
}
export function encabezadosCargaMasiva(year:number,month:number):(string|number)[]{
 const count=diasMes(year,month),y=String(year),m=String(month).padStart(2,"0");
 return ["DNI","Roster","TipoPuesto",...Array.from({length:count},(_,i)=>Number(`${y}${m}${String(i+1).padStart(2,"0")}`))];
}
export function generarMatrizCargaMasiva(input:{year:number;month:number;aprobado:boolean;trabajadores:readonly RegistroHH[]}):(string|number)[][]{
 if(!input.aprobado)throw new Error("Operaciones debe aprobar el periodo antes de generar carga masiva");
 const count=diasMes(input.year,input.month),seen=new Set<string>();
 const salida:(string|number)[][]=[encabezadosCargaMasiva(input.year,input.month)];
 for(const t of input.trabajadores){
  const dni=t.dni.trim();
  if(!/^\d{8}$/.test(dni)||seen.has(dni))throw new Error(`DNI inválido o duplicado: ${dni}`);
  seen.add(dni);
  if(!/^\d{1,2}[xX]\d{1,2}$/.test(t.roster))throw new Error(`ROSTER no válido para ${dni}`);
  if(!["PERSONAL OPERATIVO","ADMINISTRATIVOS"].includes(t.tipoPuesto))throw new Error(`TipoPuesto no válido para ${dni}`);
  const claves=Object.keys(t.dias).map(Number);
  if(claves.length!==count||claves.some(d=>!Number.isInteger(d)||d<1||d>count))throw new Error(`Registros diarios incompletos o fuera de mes para ${dni}`);
  const values=Array.from({length:count},(_,i)=>{
   const c=t.dias[i+1];
   if(c!=="12"&&c!=="12N"&&c!=="0")throw new Error(`Código ${String(c)} sin conversión aprobada para ${dni}, día ${i+1}`);
   return c==="0"?0:12;
  });
  salida.push([dni,t.roster,t.tipoPuesto,...values]);
 }
 return salida;
}
