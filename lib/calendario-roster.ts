/** Límites de mes y días civiles peruanos; intervalos semiabiertos. */
export function mesPeru(mes:string){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes))throw new Error('Mes inválido');
 const [y,m]=mes.split('-').map(Number);if(y<1900||y>2100)throw new Error('Año inválido');
 const inicio=new Date(`${mes}-01T00:00:00-05:00`);const dias=new Date(Date.UTC(y,m,0)).getUTCDate();
 return {inicio,fin:new Date(inicio.getTime()+dias*86400000),dias};
}
export function coincideDia(inicio:Date,fin:Date,mesInicio:Date,dia:number){const a=mesInicio.getTime()+(dia-1)*86400000;return inicio.getTime()<a+86400000&&fin.getTime()>a;}
export function mesActualPeru(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit'}).formatToParts(now).filter(p=>p.type==='year'||p.type==='month').map(p=>p.value).join('-');}
