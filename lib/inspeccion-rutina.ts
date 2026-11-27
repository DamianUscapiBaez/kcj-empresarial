import {catalogoChecklist,type CatalogItem,type ResultadoItem,cantidadInventario} from './vehiculos-integrados.ts';
export const VERSION_RUTINA=2;
export const CONTEXTO_RUTINA='INSPECCION_RUTINA';
export type Ambito='INSITE'|'OFFSITE'|'MIXTO';
export type ConfigEquipo={itemCode:string;expectedQuantity:number;actualQuantity:number;label:string};
export type ItemRutina=CatalogItem & {minimum:number|null;reference:string};
export type RespuestaRutina={code:string;result:ResultadoItem;note:string;found:number|null;detail:string};
export function catalogoRutina(tipo:string,equipment:ConfigEquipo[],ambito:Ambito,escolta:boolean,patrulla:boolean,accesoMina:boolean):ItemRutina[]{
 if(!['INSITE','OFFSITE','MIXTO'].includes(ambito))throw new Error('Ámbito inválido');
 if(tipo!=='CAMIONETA'&&(escolta||patrulla))throw new Error('Escolta/patrulla de camioneta: seleccione la configuración aplicable');
 if(escolta&&ambito==='INSITE')throw new Error('Escolta OFFSITE requiere ámbito OFFSITE o MIXTO');
 const pickup=tipo==='CAMIONETA',off=ambito!=='INSITE',general=!pickup||ambito!=='OFFSITE'||accesoMina;
 const map=new Map<string,ItemRutina>();
 for(const x of catalogoChecklist(tipo)){
  if(x.code==='CHALECOS'||(pickup&&x.code==='DVR'))continue;
  const eq=equipment.find(e=>e.itemCode===x.code);
  map.set(x.code,{...x,mandatory:x.mandatory||Boolean(eq&&(eq.expectedQuantity>0||eq.actualQuantity>0)),minimum:x.quantity?(eq?.expectedQuantity??null):null,reference:eq?'Inventario configurado':'Catálogo maestro'});
 }
 const add=(code:string,label:string,category:string,min:number|null=null,mandatory=false,critical=false,quantity=min!==null,reference='Formato físico KCJ · referencia')=>{
  const e=equipment.find(x=>x.itemCode===code),old=map.get(code);
  const minimum=quantity?(min===null?(e?.expectedQuantity??null):Math.max(min,e?.expectedQuantity??0)):null;
  map.set(code,{code,label,category,minimum,mandatory:mandatory||Boolean(minimum&&minimum>0)||Boolean(old?.mandatory)||Boolean(e&&e.actualQuantity>0),critical:critical||Boolean(old?.critical),quantity,reference:e?'Referencia + inventario configurado':reference});
 };
 for(const [code,label] of [['DOC_TIV','Tarjeta de identificación vehicular'],['DOC_SOAT','SOAT'],['DOC_POLIZA','Póliza de seguro'],['DOC_GPS','Certificado GPS'],['DOC_HOMOLOG','Homologación vehicular'],['DOC_ITV','Revisión técnica'],['DOC_INGRESO','Certificado de ingreso nuevo'],['DOC_MLB','Checklist MLB'],['DOC_AMARILLA','Tarjeta Amarilla'],['DOC_CONTRATO','Contrato de alquiler']])add(code,label,'Documentación',null,false,false,false,'Verificar documento y vigencia según aplicabilidad');
 add('CUÑAS','Cuñas de seguridad','Seguridad',2,true);add('CONOS','Conos de seguridad','Seguridad',2,true);add('TRIANGULOS','Triángulos','Seguridad',2,true);
 add('EXTINTOR',`Extintor(es) ${pickup||tipo==='MICROBUS'?'6 kg':'9 kg'}: presión, precinto, tarjeta y vigencias`,'Seguridad',tipo==='OMNIBUS'?2:1,true,true);
 add('BOTIQUIN','Botiquín: contenedor y ubicación','Seguridad',1,true);
 add('ALARMA_RETROCESO','Alarma sonora de retroceso (independiente de luces)','Luces y señales',null,true,true);
 add('CINTA_ROJA','Cinta de seguridad roja','Seguridad',1);add('CINTA_AMARILLA','Cinta de seguridad amarilla','Seguridad',1);
 add('RADIO','Radio VHF / antena / micrófono','Equipamiento electrónico',off||accesoMina?1:null,off||accesoMina,false,true);
 add('PERTIGA','Pértiga iluminada / banderín','Equipamiento minero',accesoMina?1:null,accesoMina,false,true);
 add('LINTERNA','Linterna','Herramientas',1);add('REPUESTO','Ruedas de repuesto','Neumáticos',pickup?(escolta||patrulla?2:1):null,pickup,true,true);
 if(pickup){add('DASH_CAM','DASH CAM (no DVR)','Equipamiento electrónico',null,false,false,true);add('BARRA_ANTIVUELCO','Barra antivuelco','Carrocería',null,true,true);add('MALLA_IMPACTO','Malla protectora de impacto','Carrocería',null,true,true);}
 else {add('MARTILLO_EMERGENCIA','Martillos trizadores','Seguridad',tipo==='OMNIBUS'?4:2,true,true);add('DASH_CAM','DASH CAM (si posee)','Equipamiento electrónico',null,false,false,true);}
 if(tipo==='OMNIBUS'){add('PALETAS','Paletas roja y verde (par)','Seguridad',1);add('VARAS','Varas luminosas','Seguridad',2);}
 for(const [code,label] of [['LLAVES_MIXTAS','Juego de llaves mixtas'],['GATA','Gata hidráulica con palanca'],['ALICATES','Alicate aislado'],['DESARMADOR_PLANO','Desarmador plano'],['DESARMADOR_ESTRELLA','Desarmador estrella'],['LLAVE_RUEDAS','Juego de llave de ruedas'],['MANOMETRO','Medidor de aire'],['MEDIDOR_COCADA','Medidor de cocada']])add(code,label,'Herramientas',1,true);
 for(const [code,label,min] of [['B_YODO','Yodopovidona 60 ml',pickup?1:2],['B_GASA','Gasas estériles 10 × 10 cm',pickup?5:15],['B_APOSITO','Apósito estéril 10 × 20 cm',pickup?2:5],['B_ESPARADRAPO','Esparadrapo según cartilla',2],['B_VENDA2','Venda elástica 2 × 5 yardas',2],['B_VENDA4','Venda elástica 4 × 5 yardas',2],['B_VENDA8','Venda elástica 8 × 5 yardas',2],['B_CURITAS','Curitas',pickup?10:20],['B_GUANTES','Guantes quirúrgicos descartables',pickup?2:4],['B_TIJERAS','Tijeras punta roma',pickup?null:1],['B_ALGODON','Algodón hidrófilo 25 g',pickup?null:2]] as const)add(code,label,'Botiquín · insumos',min,false,false,true,'Cartilla física de botiquín');
 if(!pickup&&off)for(const [code,label,min] of [['B_MANTAS','Mantas térmicas',2],['B_FERULA_SUP','Férulas superiores',2],['B_FERULA_INF','Férulas inferiores',2],['B_OXIGENO','Balón de oxígeno medicinal 2 L',1],['B_CANULA','Cánula binasal',2]] as const)add(code,label,'Botiquín · complemento OFFSITE',min);
 if(general||escolta){for(const [code,label,min] of [['KIT_PANOS','Paños absorbentes',escolta?25:5],['KIT_BOLSAS','Bolsas negras',general?2:null],['KIT_BOOM','Boom absorbente',escolta?2:1],['PALA','Pala',1],['PICO','Pico',1]] as const)add(code,label,'Kit de emergencias',min,false,false,true);}
 if(escolta)for(const [code,label,min] of [['KIT_VARAS','Varas luminosas',2],['KIT_LUCES','Luces de emergencia',1],['KIT_PALETAS','Paletas Pare / Siga (par)',1],['KIT_GUANTES','Guantes de cuero (pares)',2],['KIT_BOTAS','Botas de jebe (pares)',2],['KIT_RESPIRADORES','Caja de respiradores',1],['KIT_CONTENEDOR','Contenedor provisional de hidrocarburos',1]] as const)add(code,label,'Kit escolta OFFSITE',min);
 for(const [code,label,category] of [['TAPASOLES','Tapasoles','Habitáculo'],['TRABA_TUERCAS','Traba tuercas por rueda','Neumáticos'],['NEUM_CONFIG','Configuración real: ejes, posiciones, marca, medida, DOT, cocada y PSI por rueda (incluye repuestos)','Neumáticos'],['LIMPIEZA_EXTRA','Trapeador, ambientador, silicona y otros','Limpieza'],['EXTRAS','Otros accesorios o insumos efectivamente presentes','Complementarios']])add(code,label,category,null,code==='NEUM_CONFIG',code==='NEUM_CONFIG');
 for(const e of equipment){if(!map.has(e.itemCode)&&e.itemCode!=='CHALECOS'&&!(pickup&&e.itemCode==='DVR'))add(e.itemCode,e.label,'Inventario registrado',e.expectedQuantity,false,false,true);}
 return [...map.values()];
}
export function validarRutina(items:ItemRutina[],answers:RespuestaRutina[]){
 if(items.length!==answers.length||new Set(answers.map(x=>x.code)).size!==items.length)throw new Error('Debe inspeccionar todos los componentes una vez');
 let status:'CONFORME'|'OBSERVADO'|'CRITICO'='CONFORME';
 const rows=items.map(item=>{
  const a=answers.find(x=>x.code===item.code);if(!a||!['CONFORME','OBSERVADO','NO_CONFORME','NO_APLICA'].includes(a.result))throw new Error('Resultado inválido: '+item.label);
  if(a.result==='NO_APLICA'&&item.mandatory)throw new Error('No aplica no permitido: '+item.label);
  if(a.result!=='CONFORME'&&a.note.trim().length<5)throw new Error('Justifique: '+item.label);
  if(item.quantity&&a.result!=='NO_APLICA'){
   if(a.found===null)throw new Error('Registre cantidad encontrada: '+item.label);cantidadInventario(a.found);
   if(a.result==='CONFORME'&&item.minimum!==null&&a.found<item.minimum)throw new Error('Cantidad insuficiente: '+item.label);
   if(a.result==='CONFORME'&&a.found===0)throw new Error('No marque conforme un elemento ausente: '+item.label);
  } else if(a.found!==null)throw new Error('Cantidad no aplicable: '+item.label);
  if(item.code==='NEUM_CONFIG'&&a.result!=='NO_APLICA'&&a.detail.trim().length<5)throw new Error('Registre el detalle real de neumáticos');
  if(item.category.startsWith('Botiquín')&&a.result==='CONFORME'&&a.detail.trim().length<3)throw new Error('Registre vencimiento/lote o sustente que no aplica: '+item.label);
  if(item.critical&&a.result==='NO_CONFORME')status='CRITICO';
  else if(a.result==='OBSERVADO'||a.result==='NO_CONFORME'){if(status==='CONFORME')status='OBSERVADO';}
  return {...a,label:item.label,category:item.category,required:item.minimum,reference:item.reference};
 });return {status,rows};
}

/** Opciones de inventario de la ficha maestra, no plantilla diaria ni obligación universal. */
export function catalogoInventarioMaestro(tipo:string):ItemRutina[]{
 const scopes=[catalogoRutina(tipo,[],'INSITE',false,false,true),catalogoRutina(tipo,[],'OFFSITE',false,false,true),...(tipo==='CAMIONETA'?[catalogoRutina(tipo,[],'OFFSITE',true,false,false)]:[])];
 const out=new Map<string,ItemRutina>();for(const scope of scopes)for(const item of scope)if(item.quantity&&!out.has(item.code))out.set(item.code,item);
 return [...out.values()];
}
