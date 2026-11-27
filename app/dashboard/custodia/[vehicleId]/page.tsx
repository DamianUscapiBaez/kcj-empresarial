import Link from "next/link";
import {randomUUID} from "node:crypto";
import {notFound,redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {requireUser} from "@/lib/auth";
import {panelActual} from "@/lib/panel-sesion";
import {rolesParaPanel} from "@/lib/paneles-kcj";
import {EvidenceUploader} from "@/components/ui/EvidenceUploader";
import {FotosCustodiaUploader} from "@/components/dominio/FotosCustodiaUploader";
import {DataTable,InlineAction,RecordForm} from "@/components/ui/fields";
import {registrarEntregaComparativa,registrarRecepcionComparativa,resolverDiferenciaCustodia} from "@/app/actions-custodia";
import {verificarRecepcionTecnica,verificarRecepcionSSOMA} from "@/app/actions-operativas";
const fecha=(d:Date)=>new Intl.DateTimeFormat("es-PE",{dateStyle:"medium",timeStyle:"short",timeZone:"America/Lima"}).format(d);
const clasesInput="input";
const estados=[{value:"CONFORME",label:"Conforme"},{value:"OBSERVADO",label:"Observado"},{value:"NO_CONFORME",label:"No conforme"}];

/** Una sola ficha por unidad: la plantilla y las cantidades provienen de Flota. */
export default async function CustodiaUnidad({params}:{params:Promise<{vehicleId:string}>}){
 const {vehicleId}=await params;
 const user=await requireUser();
 const panel=await panelActual(user);
 if(!panel)redirect("/seleccionar-panel");
 if(panel==="conductor")notFound();
 if(!rolesParaPanel(user,panel).some(r=>["ADMIN","OPERACIONES","JEFE_OPERACIONES","MANTENIMIENTO","SSOMA"].includes(r)))notFound();
 const vehicle=await prisma.vehicle.findUnique({where:{id:vehicleId},include:{
  equipment:{orderBy:[{category:"asc"},{label:"asc"}]},
  custody:{orderBy:[{at:"desc"},{id:"desc"}],include:{items:{orderBy:{label:"asc"}},signatures:true},take:25}
 }});
 if(!vehicle)notFound();
 const latest=vehicle.custody[0];
 const canRecord=rolesParaPanel(user,panel).some(r=>["ADMIN","OPERACIONES","JEFE_OPERACIONES"].includes(r));
 const inThirdParty=latest?.kind==="ENTREGA";
 const pendingReview=latest?.kind==="RECEPCION"&&(!latest.technicalVerifiedAt||!latest.safetyVerifiedAt);
 const unresolved=latest?.kind==="RECEPCION"?latest.items.filter(i=>i.discrepancy&&!i.resolvedAt):[];
 const canDeliver=canRecord&&!inThirdParty&&!pendingReview&&vehicle.equipment.length>0;
 const canReceive=canRecord&&inThirdParty&&latest.items.length>0;
 return <div className="space-y-6">
  <nav className="text-sm text-slate-700"><Link href="/dashboard/custodia" className="text-kcj-red font-semibold hover:underline">Entrega y recepción</Link> / {vehicle.code} · {vehicle.plate}</nav>
  <header className="card space-y-2">
   <p className="kcj-eyebrow">KCJ CONTROL · Actas individuales</p>
   <h1 className="text-2xl font-black text-kcj-charcoal">{vehicle.code} · {vehicle.plate}</h1>
   <p className="text-sm text-slate-700">Tipo: <strong>{vehicle.type}</strong> · Componentes inventariados en esta unidad: <strong>{vehicle.equipment.length}</strong></p>
   <p className="text-sm text-slate-700">Estado de custodia: <strong>{inThirdParty?"Entregada a tercero":pendingReview?"Recibida, en revisión":latest?.kind==="RECEPCION"?"Recepción con conformidades registradas":"Sin entrega previa"}</strong>.</p>
   <p className="text-xs text-slate-600">El inventario se basa en ESTA unidad, no en un listado genérico para camionetas, microbuses, minibuses u ómnibus. Las actas anteriores permanecen inalteradas.</p>
  </header>
  {!vehicle.equipment.length&&<p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Antes de realizar una entrega, <Link href={`/dashboard/ficha-vehicular/${vehicle.id}`} className="underline font-semibold">completa el inventario de equipamiento real en Flota</Link>. No se debe generar una entrega con lista vacía.</p>}
  {canDeliver&&<form id="entrega" action={registrarEntregaComparativa} className="card space-y-4">
   <h2 className="kcj-card-heading">Acta de ENTREGA a tercero</h2>
   <p className="text-sm text-slate-600">La entrega guardará una copia histórica de los {vehicle.equipment.length} componentes actualmente registrados para esta unidad.</p>
   <input type="hidden" name="vehicleId" value={vehicle.id}/><input type="hidden" name="clientEventId" value={randomUUID()}/>
   <div className="grid gap-4 sm:grid-cols-2">
    <label className="space-y-1 text-sm font-semibold">Tercero / empresa receptora *<input className={clasesInput} name="party" required maxLength={140}/></label>
    <label className="space-y-1 text-sm font-semibold">Lugar de entrega *<input className={clasesInput} name="location" required maxLength={160}/></label>
    <label className="space-y-1 text-sm font-semibold">Entrega (responsable KCJ) *<input className={clasesInput} name="senderName" required maxLength={140}/></label>
    <label className="space-y-1 text-sm font-semibold">Recibe (responsable tercero) *<input className={clasesInput} name="receiverName" required maxLength={140}/></label>
    <label className="space-y-1 text-sm font-semibold">Kilometraje de entrega *<input className={clasesInput} type="number" min={0} step={1} name="odometerKm" required/></label>
    <label className="space-y-1 text-sm font-semibold">Combustible (%) *<input className={clasesInput} type="number" min={0} max={100} step={1} name="fuelPercent" required/></label>
    <label className="space-y-1 text-sm font-semibold sm:col-span-2">Estado general y observaciones *<textarea name="condition" className={clasesInput} rows={3} required minLength={5}/></label>
   </div>
   <h3 className="font-semibold">Inventario real que acompaña a la entrega</h3>
   <DataTable title="Instantánea de equipamiento de salida" rows={vehicle.equipment.map(i=>({id:i.id,data:{Equipo:i.label,Cantidad:String(i.actualQuantity),Estado:i.condition,Funcionamiento:i.functionalStatus,Serie:i.serial??"—"}}))}/>
   <div><p className="font-semibold text-sm mb-2">Evidencia fotográfica / respaldo de entrega *</p><EvidenceUploader name="evidenceKey" purpose="CUSTODIA" required/></div>
   <button type="submit" className="btn">Registrar entrega con inventario</button>
   <p className="text-xs text-slate-600">Después de registrar el acta, abre «Ver acta, firmar / PDF» en el historial para que ambas partes firmen sobre el documento definitivo.</p>
  </form>}
  {canRecord&&!canDeliver&&!inThirdParty&&vehicle.equipment.length>0&&<p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">La unidad todavía no puede entregarse porque falta la revisión posterior a una recepción o existe una restricción vigente.</p>}
  {canReceive&&latest&&<form id="recepcion" action={registrarRecepcionComparativa} className="card space-y-4">
   <h2 className="kcj-card-heading">Acta de RECEPCIÓN — Comparación con entrega del {fecha(latest.at)}</h2>
   <p className="text-sm text-slate-600">Debes revisar cada equipo recibido y adjuntar fotografías por componente cuando esté dañado u observado. Estas fotos se fijarán en el acta antes de ambas firmas. Las cantidades originales se conservan aunque después se edite el inventario de Flota.</p>
   <input type="hidden" name="vehicleId" value={vehicle.id}/><input type="hidden" name="deliveryId" value={latest.id}/><input type="hidden" name="clientEventId" value={randomUUID()}/>
   <div className="grid gap-4 sm:grid-cols-2">
    <label className="text-sm font-semibold space-y-1">Tercero que devuelve *<input className={clasesInput} name="party" defaultValue={latest.party} required/></label>
    <label className="text-sm font-semibold space-y-1">Lugar de recepción *<input className={clasesInput} name="location" required/></label>
    <label className="text-sm font-semibold space-y-1">Entrega (representante tercero) *<input className={clasesInput} name="senderName" required/></label>
    <label className="text-sm font-semibold space-y-1">Recibe (representante KCJ) *<input className={clasesInput} name="receiverName" required/></label>
    <label className="text-sm font-semibold space-y-1">Odómetro al devolver * (mínimo {latest.odometerKm??0} km)<input className={clasesInput} type="number" min={latest.odometerKm??0} step={1} name="odometerKm" required/></label>
    <label className="text-sm font-semibold space-y-1">Combustible al devolver (%) *<input className={clasesInput} type="number" min={0} max={100} step={1} name="fuelPercent" required/></label>
    <label className="text-sm font-semibold space-y-1 sm:col-span-2">Estado y observaciones generales *<textarea name="condition" className={clasesInput} rows={3} minLength={5} required/></label>
   </div>
   <div className="space-y-3">{latest.items.map(it=><fieldset key={it.id} className="rounded-lg border border-kcj-border p-4 space-y-2">
    <legend className="px-1 font-semibold text-sm">{it.label}</legend>
    <p className="text-xs text-slate-600">Entregado: <strong>{it.actualQuantity}</strong> · Serie: {it.serial??"Sin serie"} · Estado al entregar: {it.condition}</p>
    <div className="grid gap-3 sm:grid-cols-3">
     <label className="space-y-1 text-xs font-semibold">Cantidad recibida *<input className={clasesInput} name={`quantity_${it.itemCode}`} type="number" min={0} step={1} defaultValue={it.actualQuantity} required/></label>
     <label className="space-y-1 text-xs font-semibold">Cantidad dañada *<input className={clasesInput} name={`damaged_${it.itemCode}`} type="number" min={0} step={1} defaultValue={0} required/></label>
     <label className="space-y-1 text-xs font-semibold">Condición al devolver *<select className={clasesInput} name={`condition_${it.itemCode}`} defaultValue="CONFORME" required>{estados.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
    </div>
    <label className="block space-y-1 text-xs font-semibold">Observación del ítem (obligatoria si hay diferencia o daño)<textarea className={clasesInput} name={`notes_${it.itemCode}`} rows={2}/></label>
    <FotosCustodiaUploader itemCode={it.itemCode} label={it.label}/>
   </fieldset>)}</div>
   <div><p className="font-semibold text-sm mb-2">Evidencia general / respaldo de devolución *</p><EvidenceUploader name="evidenceKey" purpose="CUSTODIA" required/></div>
   <button type="submit" className="btn">Registrar devolución y comparar inventario</button>
   <p className="text-xs text-slate-600">Después de registrar el acta, abre «Ver acta, firmar / PDF» en el historial para capturar las firmas de ambas partes en pantalla ampliada.</p>
  </form>}
  {inThirdParty&&latest&&!latest.items.length&&<p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">La entrega anterior es del formato legado sin inventario por componente. Debe regularizarse con un procedimiento supervisado por TI y Operaciones; no se inventarán cantidades automáticamente.</p>}
  {latest?.kind==="RECEPCION"&&<section className="card space-y-4">
   <h2 className="kcj-card-heading">Revisión de recepción y diferencias</h2>
   <p className="text-sm">Diferencias sin resolver: <strong>{unresolved.length}</strong> · Mantenimiento: {latest.technicalVerifiedAt?"Conformidad registrada":"Pendiente"} · SSOMA: {latest.safetyVerifiedAt?"Conformidad registrada":"Pendiente"}.</p>
   <DataTable title="Comparación del inventario recibido" rows={latest.items.map(it=>({id:it.id,data:{Elemento:it.label,Entrega:String(it.expectedQuantity),Recepción:String(it.actualQuantity),Dañados:String(it.damagedQuantity),Condición:it.condition,Estado:it.discrepancy?it.resolvedAt?"Diferencia resuelta":"Diferencia pendiente":"Sin diferencia"}}))}/>
   {canRecord&&unresolved.map(i=><div key={i.id} className="border rounded-lg p-4 space-y-2">
    <h3 className="font-semibold">Resolver diferencia: {i.label}</h3>
    <RecordForm title="Documentar resolución" action={resolverDiferenciaCustodia} submit="Registrar resolución" fields={[{name:"lineId",label:"Línea",type:"hidden",value:i.id},{name:"reason",label:"Qué se resolvió y por qué",type:"textarea"},{name:"evidenceKey",label:"Evidencia de resolución",type:"evidence",evidencePurpose:"CUSTODIA"}]}/>
   </div>)}
   {unresolved.length===0&&<div className="flex flex-wrap gap-2">
    {rolesParaPanel(user,panel).includes("MANTENIMIENTO")&&!latest.technicalVerifiedAt&&<InlineAction action={verificarRecepcionTecnica} label="Registrar conformidad de Mantenimiento" fields={[{name:"id",value:latest.id}]}/>}
    {rolesParaPanel(user,panel).includes("SSOMA")&&!latest.safetyVerifiedAt&&<InlineAction action={verificarRecepcionSSOMA} label="Registrar conformidad de SSOMA" fields={[{name:"id",value:latest.id}]}/>}
   </div>}
   <p className="text-xs text-slate-600">Una devolución nunca habilita por sí sola la unidad. Las dos conformidades son obligatorias y las demás restricciones documentales y operativas siguen aplicando.</p>
  </section>}
  <DataTable title="Historial permanente de actas de esta unidad" emptyMessage="Todavía no se han registrado actas para esta unidad." rows={vehicle.custody.map(x=>({id:x.id,data:{Fecha:fecha(x.at),Movimiento:x.kind,Responsable:x.party,Odómetro:x.odometerKm?.toString()??"—",Combustible:x.fuelPercent===null?"—":`${x.fuelPercent}%`,Ítems:String(x.items.length),Firmas:`${x.signatures.length}/2`,Diferencias:x.kind==="RECEPCION"?String(x.items.filter(i=>i.discrepancy&&!i.resolvedAt).length):"—"},actions:<Link href={`/actas/custodia/${x.id}`} className="text-kcj-red font-semibold underline">Ver acta, firmar / PDF</Link>}))}/>
 </div>;
}
