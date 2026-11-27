/** Reglas iniciales de recuperación de Flota, basadas en Documento Maestro 3.1.
 * Plantillas parametrizables: cantidades y equipamiento real los declara Operaciones.
 * No sustituyen la revisión de requisitos mineros de cada unidad o contrato.
 */
import {validarTipoUnidadKCJ, type TipoUnidadKCJ} from "./tipos-unidad.ts";

export const VERSION_CHECKLIST_VEHICULO=1;
export type ResultadoItem="CONFORME"|"OBSERVADO"|"NO_CONFORME"|"NO_APLICA";
export interface CatalogItem {code:string;label:string;category:string;mandatory:boolean;critical:boolean;quantity:boolean;}
function i(code:string,label:string,category:string,mandatory=true,critical=false,quantity=false):CatalogItem{return {code,label,category,mandatory,critical,quantity};}
const GENERAL:CatalogItem[]=[
 i("LUCES_DELANTERAS","Luces delanteras","Luces y señales",true,true),
 i("LUCES_POSTERIORES","Luces posteriores","Luces y señales",true,true),
 i("LUCES_FRENO","Luces de freno","Luces y señales",true,true),
 i("LUZ_RETROCESO","Luz visual de retroceso","Luces y señales",true,true),
 i("ALARMA_RETROCESO","Alarma SONORA de retroceso","Luces y señales",false,true),
 i("DIRECCIONALES","Direccionales y luces de emergencia","Luces y señales",true,true),
 i("FRENOS","Frenos / respuesta de frenado","Seguridad mecánica",true,true),
 i("DIRECCION","Dirección y respuesta","Seguridad mecánica",true,true),
 i("FUGAS","Fugas visibles de fluidos","Seguridad mecánica",true,true),
 i("CINTURONES","Cinturones de seguridad","Habitáculo",true,true),
 i("ESPEJOS","Espejos y visibilidad","Habitáculo",true,true),
 i("PUERTAS","Puertas y cierre seguro","Habitáculo",true,true),
 i("EXTINTOR","Extintor: presión, acceso, vencimiento y precinto","Seguridad",true,true,true),
 i("BOTIQUIN","Botiquín: contenido, vigencia e integridad","Seguridad",true,false,true),
 i("TRIANGULOS","Triángulos y señalización de emergencia","Seguridad",false,false,true),
 i("CUÑAS","Cuñas para ruedas","Seguridad",false,false,true),
 i("GATA","Gata y accesorios","Herramientas",false,false,true),
 i("LLAVE_RUEDAS","Llave de ruedas","Herramientas",false,false,true),
 i("REPUESTO","Rueda de repuesto","Herramientas",false,false,true),
 i("GPS","GPS: presencia y operación","Equipamiento electrónico",false,false,true),
 i("DVR","DVR: presencia y grabación","Equipamiento electrónico",false,false,true),
 i("CAMARAS","Cámaras: presencia y visualización","Equipamiento electrónico",false,false,true),
 i("RADIO","Radio / comunicación","Equipamiento electrónico",false,false,true),
 i("PERTIGA","Pértiga minera (un solo ítem de inventario)","Equipamiento minero",false,false,true),
 i("CIRCULINA","Circulina (un solo ítem de inventario)","Equipamiento minero",false,false,true),
 i("CINTA_INSPECCION","Cinta de inspección trimestral aplicable","Equipamiento minero",false,false),
 i("LIMPIEZA","Interior: limpieza, orden y visibilidad","Habitáculo",true,false),
];
// Componentes expresamente descritos en tabla 9.2 del Documento Maestro.
// Su exigibilidad y cantidad real dependen de cada contrato, vehículo y operación.
const COMPLEMENTARIOS:CatalogItem[]=[
 i("CONOS","Conos de seguridad","Seguridad",false,false,true),
 i("CABLE_REMOLQUE","Cable de remolque","Seguridad",false,false,true),
 i("PICO","Pico","Herramientas",false,false,true),
 i("PALA","Pala","Herramientas",false,false,true),
 i("CABLE_PASACORRIENTE","Cable pasa corriente","Herramientas",false,false,true),
 i("MANOMETRO","Manómetro de aire","Herramientas",false,false,true),
 i("MEDIDOR_COCADA","Medidor de profundidad de neumáticos","Herramientas",false,false,true),
 i("LINTERNA","Linterna","Seguridad",false,false,true),
 i("LLAVES_UNIDAD","Juego de llaves de encendido y puertas","Herramientas",false,false,true),
 i("KIT_DERRAMES","Kit antiderrame y contenido","Seguridad",false,false,true),
 i("CHALECOS","Chalecos reflectivos","Seguridad",false,false,true),
 i("PALANCA","Palanca para gata","Herramientas",false,false,true),
 i("CAJA_HERRAMIENTAS","Caja de herramientas","Herramientas",false,false,true),
 i("ALICATES","Alicates","Herramientas",false,false,true),
 i("DESTORNILLADORES","Destornilladores planos y estrella","Herramientas",false,false,true),
 i("BARRETA","Barreta","Herramientas",false,false,true),
 i("JUEGO_DADOS","Juego de dados","Herramientas",false,false,true),
 i("ACEITE_MOTOR","Nivel y estado de aceite de motor","Seguridad mecánica",true,true),
 i("REFRIGERANTE","Nivel de refrigerante","Seguridad mecánica",true,true),
 i("LIQ_FRENOS","Líquido de frenos","Seguridad mecánica",true,true),
 i("LIQ_EMBRAGUE","Líquido de embrague (si aplica)","Seguridad mecánica",false,true),
 i("LIMPIAPARABRISAS","Limpiaparabrisas y fluido","Seguridad mecánica",true,false),
 i("FAJAS_CORREAS","Fajas y correas visibles","Seguridad mecánica",false,true),
 i("RADIADOR","Radiador y sistema de enfriamiento","Seguridad mecánica",true,true),
 i("BATERIA","Batería y conexiones","Seguridad mecánica",true,true),
 i("SUSPENSION","Suspensión y holguras visibles","Seguridad mecánica",true,true),
 i("FRENO_ESTACIONAMIENTO","Freno de estacionamiento","Seguridad mecánica",true,true),
 i("TESTIGOS_TABLERO","Testigos y alarmas del tablero","Seguridad mecánica",true,true),
 i("BOCINA","Bocina","Luces y señales",true,true),
 i("LUCES_ALTAS_BAJAS","Luces altas y bajas","Luces y señales",true,true),
 i("NEBLINEROS","Neblineros (si aplica)","Luces y señales",false,false),
 i("LUZ_PLACA","Luz de placa","Luces y señales",true,false),
 i("LUZ_SALON","Iluminación de salón / cabina","Luces y señales",false,false),
 i("REFLECTIVOS","Reflectivos y cintas de seguridad","Luces y señales",false,false),
 i("CAM_RETROCESO","Cámara o sensor de retroceso (si aplica)","Equipamiento electrónico",false,false,true),
 i("ALARMA_PUERTAS","Alarma de apertura de puertas (si aplica)","Seguridad",false,true),
 i("PISO_INTERIOR","Piso interior y pasos","Habitáculo",true,false),
 i("CALEFACCION","Calefacción","Habitáculo",false,false),
 i("AIRE_ACONDICIONADO","Aire acondicionado","Habitáculo",false,false),
 i("VISOR_VIDEO","Monitor y visor de cámaras (si aplica)","Equipamiento electrónico",false,false,true),
 i("AUDIO","Radio/audio y parlantes","Habitáculo",false,false),
 i("PANTALLA_TV","Pantalla multimedia / control remoto (si aplica)","Habitáculo",false,false,true),
 i("CORTINAS","Cortinas y accesorios (si aplica)","Habitáculo",false,false,true),
 i("FUNDAS","Fundas de asientos","Habitáculo",false,false,true),
 i("CRISTALES","Vidrios y parabrisas","Carrocería",true,true),
 i("CARROCERIA","Carrocería, rayones y abolladuras","Carrocería",true,false),
 i("PARACHOQUES","Parachoques","Carrocería",true,false),
 i("PINTURA","Pintura y acabado","Carrocería",false,false),
 i("CAPO","Capó y seguro","Carrocería",false,true),
 i("BALDE_LIMPIEZA","Balde de limpieza (si aplica)","Limpieza",false,false,true),
 i("CEPILLO_ESCOBA","Escoba / cepillo (si aplica)","Limpieza",false,false,true),
 i("TRAPOS","Trapos de limpieza (si aplica)","Limpieza",false,false,true),
 i("DETERGENTE","Detergente y suministros (si aplica)","Limpieza",false,false,true),
];
function neumaticos(tipo:TipoUnidadKCJ):CatalogItem[]{
 const base=[i("NEUM_DEL_IZQ","Neumático delantero izquierdo: banda, desgaste y presión","Neumáticos",true,true),i("NEUM_DEL_DER","Neumático delantero derecho: banda, desgaste y presión","Neumáticos",true,true),i("NEUM_POST_IZQ","Neumático posterior izquierdo: banda, desgaste y presión","Neumáticos",true,true),i("NEUM_POST_DER","Neumático posterior derecho: banda, desgaste y presión","Neumáticos",true,true)];
 if(tipo==="CAMIONETA")return base;
 // Las posiciones internas dependen de la configuración real de ejes: iniciales, no definitivas.
 return [...base,i("NEUM_POST_INTER_IZQ","Neumático posterior interior izquierdo (si aplica)","Neumáticos",false,true),i("NEUM_POST_INTER_DER","Neumático posterior interior derecho (si aplica)","Neumáticos",false,true)];
}
export function catalogoChecklist(tipo:string):CatalogItem[]{
 const t=validarTipoUnidadKCJ(tipo);
 const parts=[...GENERAL,...COMPLEMENTARIOS,...neumaticos(t)];
 // Equipos adicionales según tipo. Son opcionales por defecto hasta que Operaciones
 // los configure en el inventario real de cada unidad y contrato.
 if(t==="MICROBUS"||t==="MINIBUS"||t==="OMNIBUS"){
  parts.push(i("MARTILLO_EMERGENCIA","Martillos rompevidrios (si aplica)","Equipamiento de pasajeros",false,true,true));
  parts.push(i("LETREROS_EMERGENCIA","Señales o letreros de salidas de emergencia (si aplica)","Equipamiento de pasajeros",false,true,true));
  parts.push(i("ASIENTOS_PASAJEROS","Asientos y anclajes de pasajeros","Habitáculo",true,true),i("SALIDAS_EMERGENCIA","Salidas de emergencia y señalización","Seguridad",true,true),i("VENTILACION","Ventilación y climatización","Habitáculo",false,false));
 }
 if(t==="OMNIBUS")parts.push(i("BODEGAS","Puertas y seguros de bodegas","Habitáculo",false,true),i("PASILLO","Pasillo y circulación de pasajeros","Habitáculo",true,true));
 return parts;
}
export function catalogoEquipamiento(tipo:string):CatalogItem[]{return catalogoChecklist(tipo).filter(x=>x.quantity);}
export function catalogItem(tipo:string,code:string):CatalogItem{
 const found=catalogoChecklist(tipo).find(c=>c.code===code);if(!found)throw new Error("Componente no permitido para el tipo de unidad");return found;
}
export function cantidadInventario(value:number):number{
 if(!Number.isSafeInteger(value)||value<0||value>10000)throw new Error("Cantidad de equipamiento inválida");return value;
}
export function validarInventario(input:{expected:number;actual:number;condition:string;functionalStatus:string;remarks?:string}):void{
 cantidadInventario(input.expected);cantidadInventario(input.actual);
 if(input.actual!==input.expected&&input.condition==="CONFORME")throw new Error("Una diferencia de cantidad no puede figurar como Conforme");
 if(input.functionalStatus==="NO_OPERATIVO"&&input.condition==="CONFORME")throw new Error("Un equipo no operativo no puede figurar como Conforme");
 if(!["CONFORME","OBSERVADO","NO_CONFORME"].includes(input.condition))throw new Error("Estado de equipamiento inválido");
 if(!["OPERATIVO","NO_OPERATIVO","NO_PROBADO"].includes(input.functionalStatus))throw new Error("Prueba funcional inválida");
 if((input.actual!==input.expected||input.condition!=="CONFORME"||input.functionalStatus==="NO_OPERATIVO")&&!(input.remarks??"").trim())throw new Error("Registra una observación para el faltante o deficiencia");
}
export interface RespuestaChecklist{code:string;result:ResultadoItem;note:string;}
export function validarChecklist(tipo:string,responses:RespuestaChecklist[]):{status:"CONFORME"|"OBSERVADO"|"CRITICO";items:RespuestaChecklist[]}{
 const catalog=catalogoChecklist(tipo);const seen=new Set<string>();
 if(responses.length!==catalog.length)throw new Error("La inspección debe incluir todos los componentes aplicables");
 let status:"CONFORME"|"OBSERVADO"|"CRITICO"="CONFORME";
 for(const answer of responses){
  const item=catalog.find(x=>x.code===answer.code);
  if(!item||seen.has(answer.code))throw new Error("Componente duplicado o inválido");seen.add(answer.code);
  if(!["CONFORME","OBSERVADO","NO_CONFORME","NO_APLICA"].includes(answer.result))throw new Error("Resultado de inspección inválido");
  if(answer.result==="NO_APLICA"&&item.mandatory)throw new Error(`No aplica no permitido en elemento obligatorio: ${item.label}`);
  if(answer.result!=="CONFORME"&&answer.note.trim().length<5)throw new Error(`Explica el resultado de: ${item.label}`);
  if(answer.result==="NO_CONFORME"&&item.critical)status="CRITICO";
  else if(answer.result!=="CONFORME"&&status==="CONFORME")status="OBSERVADO";
 }
 return {status,items:responses};
}
