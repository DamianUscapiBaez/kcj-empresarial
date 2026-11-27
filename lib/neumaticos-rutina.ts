/** Una fila por neumático observado, incluida rueda de repuesto. Sin inventar configuración por categoría. */
export type NeumaticoRutina={position:string;brand:string;size:string;condition:string;depth:string;pressure:string};
export function validarNeumaticosRutina(value:unknown):NeumaticoRutina[]{
 if(!Array.isArray(value)||value.length<1||value.length>40)throw new Error('Registre la distribución real de neumáticos y repuestos (1 a 40 posiciones).');
 const seen=new Set<string>();return value.map(x=>{
  if(!x||typeof x!=='object')throw new Error('Neumático inválido');
  const get=(key:string,max=80)=>{const s=x[key];if(typeof s!=='string'||!s.trim()||s.trim().length>max)throw new Error('Complete '+key+' de cada neumático');return s.trim();};
  const position=get('position'),brand=get('brand'),size=get('size'),condition=get('condition'),depth=get('depth',12),pressure=get('pressure',12);
  const id=position.toUpperCase();if(seen.has(id))throw new Error('Posición duplicada: '+position);seen.add(id);
  if(!['CONFORME','OBSERVADO','NO_CONFORME'].includes(condition))throw new Error('Condición inválida');
  for(const [val,max] of [[depth,100],[pressure,250]] as const){if(val!=='NO_MEDIDO'&&(!/^\d+(\.\d+)?$/.test(val)||Number(val)>max))throw new Error('Medición inválida');}
  if(condition==='CONFORME'&&(depth==='NO_MEDIDO'||pressure==='NO_MEDIDO'))throw new Error('Sin medición no se puede indicar conforme.');
  return {position,brand,size,condition,depth,pressure};
 });
}
