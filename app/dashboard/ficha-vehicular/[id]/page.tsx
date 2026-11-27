import Link from "next/link";
import {randomUUID} from "node:crypto";
import {notFound,redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {requireUser} from "@/lib/auth";
import {panelActual} from "@/lib/panel-sesion";
import {rolesParaPanel} from "@/lib/paneles-kcj";
import {tieneRol} from "@/lib/permisos-kcj";
import {canAccess} from "@/lib/modulos";
import {RecordForm,DataTable} from "@/components/ui/fields";
import {SelectorUnidad} from "@/components/dominio/SelectorUnidad";
import {DOCUMENTOS_VEHICULARES_GENERALES, REQUISITOS_MINEROS_VEHICULARES, ESTADOS_DOCUMENTO_MINERO} from "@/lib/requisitos-mineros-kcj";
import {catalogoInventarioMaestro} from "@/lib/inspeccion-rutina";
import {catalogoChecklist} from "@/lib/vehiculos-integrados";
import {descripcionEstadoDocumento} from "@/lib/propietarios-kcj";
import {ChecklistUnidadForm} from "@/components/dominio/ChecklistUnidadForm";
import * as veh from "@/app/actions-vehiculos";
import * as op from "@/app/actions-operativas";
const fmt=(d:Date|null|undefined)=>d?new Intl.DateTimeFormat("es-PE",{dateStyle:"medium",timeZone:"America/Lima"}).format(d):"—";
function Section({id,title,children}:{id:string;title:string;children:React.ReactNode}){return <section id={id} className="scroll-mt-24 space-y-3"><h2 className="text-lg font-black text-kcj-charcoal">{title}</h2>{children}</section>}
export default async function FichaVehicular({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const user=await requireUser(),panel=await panelActual(user);
 if(!panel)redirect("/seleccionar-panel");
 if(panel==="conductor"||!canAccess(rolesParaPanel(user,panel),"flota"))notFound();
 const isOwner=rolesParaPanel(user,panel).includes("PROPIETARIO")&&!rolesParaPanel(user,panel).some(r=>r!=="PROPIETARIO");
 // Vista restringida del dueño: NUNCA cargar expedientes internos, órdenes, inspecciones,
 // contactos de terceros, VIN ni evidencias cuando el actor solo tiene rol PROPIETARIO.
 if(isOwner){
  if(!user.ownerId)notFound();
  const own=await prisma.vehicle.findFirst({where:{id,ownerId:user.ownerId},select:{id:true,plate:true,code:true,mineCode:true,type:true,make:true,model:true,year:true,color:true,active:true,documents:{where:{kind:{in:DOCUMENTOS_VEHICULARES_GENERALES.map(x=>x.value)}},orderBy:{createdAt:"desc"},select:{id:true,kind:true,expiresAt:true,verifiedAt:true,evidenceKey:true}},miningDocuments:{where:{kind:{in:REQUISITOS_MINEROS_VEHICULARES.map(x=>x.code)}},orderBy:{createdAt:"desc"},select:{id:true,kind:true,validUntil:true,externalStatus:true,evidenceKey:true,mineScope:true}},clearances:{where:{kind:"TARJETA_AMARILLA",workerId:null},orderBy:{createdAt:"desc"},select:{id:true,scope:true,validUntil:true,verified:true,evidenceKey:true}},readings:{where:{evidenceKey:{not:null}},orderBy:{at:"desc"},select:{kilometers:true,at:true,evidenceKey:true},take:1},equipment:{orderBy:{label:"asc"},select:{id:true,label:true,itemCode:true,expectedQuantity:true,actualQuantity:true,condition:true,functionalStatus:true,updatedAt:true}},workOrders:{where:{status:{not:"LIBERADA"}},select:{id:true}},checklists:{where:{context:"INSPECCION_RUTINA"},orderBy:{performedAt:"desc"},take:1,select:{performedAt:true,status:true,items:true}}}});
  if(!own)notFound();
  const options=await prisma.vehicle.findMany({where:{ownerId:user.ownerId},select:{id:true,plate:true,code:true,type:true},orderBy:{plate:"asc"},take:400});
  const links=(id:string,tipo:string,ready:boolean)=>ready?<span className="flex flex-wrap gap-2"><a className="underline" href={`/api/proveedor/documento?tipo=${tipo}&id=${encodeURIComponent(id)}`} target="_blank" rel="noreferrer">Ver PDF</a><a className="underline" href={`/api/proveedor/documento?tipo=${tipo}&id=${encodeURIComponent(id)}&descargar=1`}>Descargar</a></span>:undefined;
  const firstBy=<T,>(rows:T[],key:(r:T)=>string)=>rows.filter((r,i)=>rows.findIndex(x=>key(x)===key(r))===i);
  const reading=own.readings[0];const verified=reading?await prisma.evidenceAsset.findUnique({where:{key:reading.evidenceKey!},select:{verifiedAt:true}}):null;
  const latest=own.checklists[0];const snapshot=latest?.items as {rows?:{code:string;label:string;category:string;required:number|null;found:number|null;result:string}[];tires?:{position:string;brand:string;size:string;condition:string;depth:string;pressure:string}[]}|undefined;
  return <main className="space-y-5">
   <Link href="/dashboard/propietarios" className="text-sm font-bold text-kcj-red underline">Volver a mis unidades</Link>
   <header className="card space-y-2"><p className="kcj-eyebrow">KCJ CONTROL · Proveedor vehicular</p><h1 className="text-2xl font-black">{own.plate} · {own.code}</h1><p>{own.type} · {[own.make,own.model,own.year,own.color].filter(Boolean).join(" ")} · Código minero: {own.mineCode??"Sin registrar"}</p><p>Último odómetro con evidencia confirmada: {verified?.verifiedAt&&reading?`${reading.kilometers} km · ${fmt(reading.at)}`:"Sin lectura confirmada"}</p><p>Estado general: {!own.active?"Inactiva":own.workOrders.length?"Mantenimiento pendiente":"Sin órdenes abiertas registradas"}. No equivale a habilitación para operar.</p></header>
   <SelectorUnidad units={options} actual={id}/>
   <DataTable title="Documentación vehicular" emptyMessage="Sin documentos registrados." rows={firstBy(own.documents,d=>d.kind).map(d=>({id:d.id,data:{Documento:DOCUMENTOS_VEHICULARES_GENERALES.find(x=>x.value===d.kind)?.label??d.kind,Vencimiento:fmt(d.expiresAt),Estado:descripcionEstadoDocumento(d.expiresAt),Verificación:d.verifiedAt?"Verificado":"Pendiente"},actions:links(d.id,"general",!!d.verifiedAt&&!!d.evidenceKey)}))}/>
   <DataTable title="Documentos mineros" rows={firstBy(own.miningDocuments,d=>d.kind+":"+d.mineScope).map(d=>({id:d.id,data:{Documento:REQUISITOS_MINEROS_VEHICULARES.find(x=>x.code===d.kind)?.label??d.kind,Vencimiento:fmt(d.validUntil),Estado:d.externalStatus},actions:links(d.id,"minero",d.externalStatus==="APROBADO"&&!!d.evidenceKey)}))}/>
   <DataTable title="Tarjeta Amarilla" rows={firstBy(own.clearances,d=>d.scope).map(d=>({id:d.id,data:{Alcance:d.scope,Vencimiento:fmt(d.validUntil),Estado:d.verified?descripcionEstadoDocumento(d.validUntil):"Pendiente"},actions:links(d.id,"pase",d.verified&&!!d.evidenceKey)}))}/>
   <DataTable title="Inventario registrado de mi unidad" rows={own.equipment.filter(x=>x.itemCode!=="CHALECOS"&&!(own.type==="CAMIONETA"&&x.itemCode==="DVR")).map(x=>({id:x.id,data:{Implemento:x.label,Requerido:String(x.expectedQuantity),Registrado:String(x.actualQuantity),Estado:x.condition,Funcionamiento:x.functionalStatus,Actualización:fmt(x.updatedAt)}}))}/>
   <p className="text-sm">Última inspección de rutina: {latest?`${fmt(latest.performedAt)} · ${latest.status}`:"Sin registrar"}. Las cantidades observadas no reemplazan el inventario maestro.</p>
   <DataTable title="Resultado de última inspección de rutina" rows={(snapshot?.rows??[]).map(x=>({id:x.code,data:{Componente:x.label,Requerido:String(x.required??"—"),Encontrado:String(x.found??"—"),Resultado:x.result}}))}/>
   <DataTable title="Neumáticos observados en última inspección" emptyMessage="Sin registro individual estructurado de neumáticos." rows={(snapshot?.tires??[]).map(x=>({id:x.position,data:{Posición:x.position,Marca:x.brand,Medida:x.size,Condición:x.condition,Cocada:x.depth,Presión:x.pressure}}))}/>
   <p className="text-sm text-slate-600">Consulta de solo lectura. Los PDF corresponden a documentos vehiculares verificados; los expedientes internos, datos personales y actas sin vinculación individual al proveedor no están disponibles.</p>
  </main>;
 }
 const vehicle=await prisma.vehicle.findUnique({where:{id},include:{owner:{select:{name:true}},documents:{orderBy:{createdAt:"desc"},take:100},equipment:{orderBy:[{category:"asc"},{label:"asc"}]},checklists:{orderBy:{performedAt:"desc"},take:25},clearances:{where:{kind:"TARJETA_AMARILLA"},orderBy:{createdAt:"desc"},take:30},miningDocuments:{orderBy:{createdAt:"desc"},take:150},custody:{orderBy:{at:"desc"},take:15},readings:{orderBy:{at:"desc"},take:5},workOrders:{orderBy:{openedAt:"desc"},take:5}}});
 if(!vehicle||(isOwner&&vehicle.ownerId!==user.ownerId))notFound();
 const scope=isOwner?{ownerId:user.ownerId??"__NO_OWNER__"}:undefined;
 const options=await prisma.vehicle.findMany({where:scope,select:{id:true,code:true,plate:true,type:true},orderBy:{code:"asc"},take:400});
 const canManage=rolesParaPanel(user,panel).some(r=>["ADMIN","OPERACIONES","JEFE_OPERACIONES"].includes(r))&&!isOwner;
 const equips=catalogoInventarioMaestro(vehicle.type),checks=catalogoChecklist(vehicle.type);
 // La ficha es empresarial: ninguna operación minera se impone a todos los vehículos.
 // Los resultados se muestran por su operación de origen, sin mezclar vigencias de minas distintas.
 const now=new Date();
 const passes=vehicle.clearances;
 const hayPaseVigente=passes.some(c=>c.verified&&c.validUntil>=now);
 const resultadoMinero=vehicle.miningDocuments.map(m=>({id:m.id,data:{
  Operación:m.mineScope,
  Requisito:REQUISITOS_MINEROS_VEHICULARES.find(r=>r.code===m.kind)?.label??m.kind,
  Estado:m.externalStatus,Emisión:fmt(m.issuedAt),Vencimiento:fmt(m.validUntil),
  Archivo:m.evidenceKey?"Con evidencia":"Sin archivo",Referencia:m.reference??"—"
 }}));
 return <div className="space-y-6">
  <nav aria-label="Ruta" className="text-sm"><Link href="/dashboard/flota" className="font-semibold text-kcj-red hover:underline">Operaciones / Flota</Link> / Ficha de unidad</nav>
  <SelectorUnidad units={options} actual={id}/>
  <header className="card space-y-2"><p className="kcj-eyebrow">KCJ PERÚ S.A.C. · Ficha maestra única por vehículo</p><h1 className="text-2xl font-black text-kcj-charcoal">{vehicle.code} · {vehicle.plate}</h1>
   <p className="text-sm text-slate-700">{vehicle.type} · {vehicle.make??"Marca pendiente"} {vehicle.model??""} · Propietario: {vehicle.owner?.name??"Sin vincular"}</p>
   <p className="text-sm font-semibold text-slate-800">Pase minero por operación: {passes.length?(hayPaseVigente?"Existe al menos un pase vigente; comprueba la operación específica abajo":"Sin pases vigentes verificados") : "Sin registrar"}</p>
   <p className="text-xs text-slate-600">Los requisitos son comunes; cada documento, evidencia, resultado y vencimiento pertenece únicamente a esta unidad.</p>
  </header>
  <nav aria-label="Secciones de la ficha" className="flex flex-wrap gap-2 text-sm font-semibold">{[["identidad","Identificación"],["documentos","Documentos"],["habilitacion-minera","Habilitación minera"],["equipamiento","Equipamiento"],["inspecciones","Inspecciones"],["historial","Historial"]].map(([slug,label])=><a key={slug} href={`#${slug}`} className="rounded-lg border border-kcj-border bg-white px-3 py-2 hover:border-kcj-red hover:text-kcj-red">{label}</a>)}</nav>
  <Section id="identidad" title="1. Datos generales de la unidad">
   <DataTable title="Identificación de la unidad" rows={[{id:vehicle.id,data:{Placa:vehicle.plate,"Código KCJ":vehicle.code,Tipo:vehicle.type,Color:vehicle.color??"—","VIN / serie":vehicle.vin??"—",Motor:vehicle.engineNumber??"—","Código minero":vehicle.mineCode??"—","Último odómetro":vehicle.readings[0]?`${vehicle.readings[0].kilometers} km`:"Pendiente"}}]}/>
   {canManage&&<RecordForm title="Completar datos de esta misma unidad" submit="Guardar identificación" action={veh.completarFichaVehiculo} fields={[{name:"vehicleId",label:"Unidad",type:"hidden",value:id},{name:"color",uniforme:true,label:"Color",required:false,value:vehicle.color??""},{name:"vin",label:"VIN / serie",required:false,value:vehicle.vin??""},{name:"engineNumber",label:"Número de motor",required:false,value:vehicle.engineNumber??""},{name:"mineCode",label:"Código de operación minera (si corresponde)",required:false,value:vehicle.mineCode??""}]}/>}
  </Section>
  <Section id="documentos" title="2. Documentación vehicular general">
   <p className="text-sm text-slate-700">Documentos propios de la unidad; no se mezclan con certificaciones del personal. Cada actualización genera otra versión y conserva la anterior.</p>
   <DataTable title="Documentos de esta unidad" emptyMessage="Sin documentos registrados para esta unidad. Operaciones puede cargarlos desde el formulario inferior." rows={vehicle.documents.map(d=>({id:d.id,data:{Documento:DOCUMENTOS_VEHICULARES_GENERALES.find(x=>x.value===d.kind)?.label??d.kind,Referencia:d.reference??"—",Vencimiento:fmt(d.expiresAt),Verificación:d.verifiedAt?"Verificado internamente":"Pendiente",Archivo:d.evidenceKey?"Con evidencia":"Sin archivo"}}))}/>
   {canManage&&<RecordForm title="Agregar nueva versión de documento vehicular" submit="Guardar documento de la unidad" action={op.registrarDocumento} fields={[{name:"vehicleId",label:"Unidad",type:"hidden",value:id},{name:"kind",label:"Tipo de documento",type:"select",options:DOCUMENTOS_VEHICULARES_GENERALES.map(x=>({...x}))},{name:"reference",label:"Referencia / número",required:false},{name:"expiresAt",label:"Fecha de vencimiento (cuando aplique; obligatoria en SOAT, revisión y póliza)",type:"date",required:false},{name:"evidenceKey",label:"Archivo de evidencia",type:"evidence",evidencePurpose:"FLOTA",required:false},{name:"verified",label:"Documento revisado por Operaciones (requiere archivo)",type:"checkbox",required:false}]}/>}
  </Section>
  <Section id="habilitacion-minera" title="3. Habilitación minera — unidad vehicular">
   <p className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950"><strong>Tarjeta Amarilla = Pase Minero de la unidad.</strong> No es una certificación del trabajador. La entidad minera competente emite o valida la autorización; KCJ registra el resultado y controla su vigencia. Los requisitos aplican según tipo de unidad y operación, no todos son obligatorios.</p>
   <DataTable title="Historial de Tarjeta Amarilla / Pase Minero" emptyMessage="Sin pase minero registrado. No significa que la unidad esté habilitada para ingresar a mina." rows={vehicle.clearances.map(x=>({id:x.id,data:{Operación:x.scope,Referencia:x.reference??"—",Emisión:fmt(x.issuedAt),Vencimiento:fmt(x.validUntil),Verificación:x.verified?"Verificada":"Pendiente",Evidencia:x.evidenceKey?"Con archivo":"Sin archivo"}}))}/>
   {canManage&&<RecordForm title="Registrar Tarjeta Amarilla / Pase Minero de esta unidad" submit="Guardar nueva versión del pase" action={veh.registrarPaseMineroUnidad} fields={[{name:"vehicleId",label:"Unidad",type:"hidden",value:id},{name:"scope",label:"Operación minera / alcance (según servicio)",required:true},{name:"reference",label:"Número / referencia de pase",required:false},{name:"issuedAt",label:"Fecha de emisión",type:"date",required:false},{name:"validUntil",label:"Vencimiento",type:"date"},{name:"evidenceKey",label:"Documento de pase minero",type:"evidence",required:false,evidencePurpose:"HOMOLOGACION"},{name:"verified",label:"Pase externo comprobado con evidencia",type:"checkbox",required:false}]}/>}
   <DataTable title="Historial documental de requisitos por operación minera" emptyMessage="Todavía no se registraron requisitos externos para esta unidad. La obligatoriedad dependerá del servicio y la operación minera." rows={resultadoMinero}/>
   <details className="rounded-lg border border-kcj-border bg-white p-3 text-sm"><summary className="cursor-pointer font-semibold">Consultar catálogo de requisitos vehiculares de referencia</summary><ul className="mt-2 list-disc space-y-1 pl-5">{REQUISITOS_MINEROS_VEHICULARES.map(x=><li key={x.code}>{x.label}</li>)}</ul><p className="mt-2 text-xs text-slate-600">Catálogo de referencia, no aprobación ni obligatoriedad automática para todas las unidades.</p></details>
   {canManage&&<RecordForm title="Registrar resultado o documento minero de esta unidad" submit="Guardar nueva versión del requisito" action={veh.registrarRequisitoMineroUnidad} fields={[{name:"vehicleId",label:"Unidad",type:"hidden",value:id},{name:"mineScope",label:"Operación minera aplicable",required:true},{name:"kind",label:"Requisito vehicular",type:"select",options:REQUISITOS_MINEROS_VEHICULARES.map(x=>({value:x.code,label:x.label}))},{name:"externalStatus",label:"Resultado recibido de la entidad externa",type:"select",options:ESTADOS_DOCUMENTO_MINERO.map(x=>({...x}))},{name:"reference",label:"Referencia de evaluación externa",required:false},{name:"issuedAt",label:"Fecha de emisión",type:"date",required:false},{name:"validUntil",label:"Fecha de vencimiento (si aplica)",type:"date",required:false},{name:"evidenceKey",label:"Documento o resultado externo",type:"evidence",evidencePurpose:"HOMOLOGACION",required:false},{name:"remarks",label:"Observaciones o justificación de no aplica",type:"textarea",required:false}]}/>}
   <p className="text-xs text-slate-600">Los estados pendientes no habilitan automáticamente la unidad. La aplicabilidad de cada requisito debe ser confirmada por Operaciones según exigencias mineras vigentes.</p>
  </Section>
  <Section id="equipamiento" title="4. Inventario de equipamiento específico">
   <DataTable title="Equipamiento y cantidades de esta unidad" emptyMessage="No existe levantamiento de inventario físico de esta unidad. El checklist no reemplaza el inventario." rows={vehicle.equipment.map(x=>({id:x.id,data:{Elemento:x.label,Esperado:String(x.expectedQuantity),Encontrado:String(x.actualQuantity),Condición:x.condition,Operatividad:x.functionalStatus,Serie:x.serial??"—",Observaciones:x.remarks??"—"}}))}/>
   {canManage&&<RecordForm title="Registrar / actualizar equipamiento de la unidad" submit="Guardar equipamiento" action={veh.registrarEquipamientoVehiculo} fields={[{name:"vehicleId",label:"Unidad",type:"hidden",value:id},{name:"itemCode",label:"Componente",type:"select",options:equips.map(x=>({value:x.code,label:x.label}))},{name:"expectedQuantity",label:"Cantidad esperada",type:"number",min:0,step:1},{name:"actualQuantity",label:"Cantidad encontrada",type:"number",min:0,step:1},{name:"condition",label:"Condición física",type:"select",options:[{value:"CONFORME",label:"Conforme"},{value:"OBSERVADO",label:"Observado"},{value:"NO_CONFORME",label:"No conforme"}]},{name:"functionalStatus",label:"Funcionamiento",type:"select",options:[{value:"OPERATIVO",label:"Operativo"},{value:"NO_OPERATIVO",label:"No operativo"},{value:"NO_PROBADO",label:"No probado"}]},{name:"serial",label:"Serie",required:false},{name:"remarks",label:"Observación o motivo",type:"textarea",required:false},{name:"evidenceKey",label:"Evidencia fotográfica",type:"evidence",required:false,evidencePurpose:"FLOTA"}]}/>}
  </Section>
  <Section id="inspecciones" title="5. Inspecciones y checklists">
   <div className="card space-y-3"><h3 className="font-bold">Checklist maestro vehicular</h3><p className="text-sm">Selecciona la modalidad. Entrega y recepción conservan el circuito de custodia; rutina registra el estado sin transferir la unidad.</p>{canManage&&<div className="flex flex-wrap gap-3"><Link className="btn" href={`/dashboard/ficha-vehicular/${id}/rutina`}>Realizar inspección de rutina</Link><Link className="btn" href={`/dashboard/custodia/${id}#entrega`}>Entrega vehicular</Link><Link className="btn" href={`/dashboard/custodia/${id}#recepcion`}>Recepción vehicular</Link></div>}</div>
   <DataTable title="Historial de inspecciones por unidad" emptyMessage="Aún no hay inspecciones estructuradas." rows={vehicle.checklists.map(x=>({id:x.id,data:{Fecha:fmt(x.performedAt),Tipo:x.context==="INSPECCION_RUTINA"?"Inspección de rutina":x.context,Versión:String(x.templateVersion),Resultado:x.status,Responsable:x.performedBy},actions:canManage&&x.context==="INSPECCION_RUTINA"?<Link className="text-kcj-red underline" href={`/dashboard/ficha-vehicular/${id}/rutina/${x.id}`}>Ver / imprimir</Link>:undefined}))}/>
   {canManage&&<details><summary className="cursor-pointer text-sm font-semibold">Inspección inicial / revisión anterior (formato histórico)</summary><ChecklistUnidadForm vehicleId={id} items={checks} eventId={randomUUID()} action={veh.registrarChecklistVehiculo}/></details>}
  </Section>
  <Section id="historial" title="6. Custodia e historial de movimientos">
   <Link href={`/dashboard/custodia/${id}`} className="font-semibold text-kcj-red underline">Abrir actas de entrega y recepción de esta unidad</Link>
   <DataTable title="Historial de entrega y recepción" emptyMessage="Aún no hay actas de custodia vinculadas." rows={vehicle.custody.map(x=>({id:x.id,data:{Movimiento:x.kind,Responsable:x.party,Fecha:fmt(x.at),Estado:x.condition,Revisión:x.kind==="RECEPCION"?(x.technicalVerifiedAt&&x.safetyVerifiedAt?"Conformidades registradas":"Pendiente de revisión"):"En custodia"}}))}/>
   <DataTable title="Órdenes recientes de mantenimiento" emptyMessage="No hay órdenes registradas." rows={vehicle.workOrders.map(x=>({id:x.id,data:{Motivo:x.issue,Estado:x.status,Apertura:fmt(x.openedAt),Liberación:fmt(x.releasedAt)}}))}/>
  </Section>
 </div>;
}
