/** Fechas ingresadas en formularios KCJ: calendario real y horario fijo de Perú (UTC-05:00).
 * No acepta normalizaciones de JavaScript como 30 de febrero -> marzo.
 * Toda la lógica es pura y se puede probar sin Next.js ni PostgreSQL.
 */
export function fechaHoraPeru(raw:string,name:string):Date {
 const value=raw.trim();
 const match=/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?)?$/.exec(value);
 if(!match)throw new Error(`Fecha no válida: ${name}`);
 const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
 const timePresent=match[4]!==undefined;
 const hour=Number(match[4]??0),minute=Number(match[5]??0),second=Number(match[6]??0);
 const leap=year%4===0&&(year%100!==0||year%400===0);
 const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 if(year<1||month<1||month>12||day<1||day>days[month-1]||hour>23||minute>59||second>59)throw new Error(`Fecha no válida: ${name}`);
 const offset=match[8];
 if(offset&&offset!=="Z"){
  const oh=Number(offset.slice(1,3)),om=Number(offset.slice(4,6));
  if(oh>14||om>59||(oh===14&&om!==0))throw new Error(`Zona horaria no válida: ${name}`);
 }
 const closesDay=!timePresent&&/(expires|validUntil|endsAt)/i.test(name);
 const clock=timePresent?`${match[4]}:${match[5]}:${match[6]??"00"}${match[7]?`.${match[7]}`:""}`:(closesDay?"23:59:59":"00:00:00");
 const asIso=`${match[1]}-${match[2]}-${match[3]}T${clock}${offset??"-05:00"}`;
 const result=new Date(asIso);
 if(!Number.isFinite(result.getTime()))throw new Error(`Fecha no válida: ${name}`);
 return result;
}
