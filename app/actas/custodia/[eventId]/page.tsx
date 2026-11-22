import Link from "next/link";
import {notFound} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {requireUser} from "@/lib/auth";
import {tieneRol} from "@/lib/permisos-kcj";
import {KcjLogo} from "@/components/ui/KcjLogo";
import {ImprimirActaButton} from "@/components/ui/ImprimirActaButton";
import {FirmaCustodiaAmpliada} from "@/components/dominio/FirmaCustodiaAmpliada";
import {huellaActaCustodia} from "@/lib/custodia-firmas";

// Copia imprimible de un registro persistido: nunca se recalcula el inventario histórico.
const fecha=(v:Date)=>new Intl.DateTimeFormat("es-PE",{dateStyle:"long",timeStyle:"short",timeZone:"America/Lima"}).format(v);
const ver=(v:string|null|undefined)=>v?.trim()||"No consignado";
export const dynamic="force-dynamic";
export default async function ActaCustodia({params}:{params:Promise<{eventId:string}>}){
 const user=await requireUser();
 if(!tieneRol(user,"ADMIN","OPERACIONES","JEFE_OPERACIONES","MANTENIMIENTO","SSOMA"))notFound();
 const {eventId}=await params;
 const acta=await prisma.custodyEvent.findUnique({where:{id:eventId},include:{
  vehicle:{select:{id:true,code:true,plate:true,type:true,make:true,model:true}},
  items:{orderBy:[{label:"asc"},{itemCode:"asc"}],include:{photos:{orderBy:{createdAt:"asc"}}}},
  signatures:true
 }});
 if(!acta)notFound();
 const entregada=acta.relatedDeliveryId?await prisma.custodyEvent.findUnique({where:{id:acta.relatedDeliveryId},select:{id:true,at:true}}):null;
 const diferencias=acta.items.filter(i=>i.discrepancy);
 const huella=huellaActaCustodia(acta);
 const puedeFirmar=tieneRol(user,"ADMIN","OPERACIONES","JEFE_OPERACIONES")&&acta.items.length>0&&!!acta.senderName&&!!acta.receiverName;
 const latest=puedeFirmar?await prisma.custodyEvent.findFirst({where:{vehicleId:acta.vehicleId},orderBy:[{at:"desc"},{id:"desc"}],select:{id:true}}):null;
 const firmaVigente=!!latest&&latest.id===acta.id;
 const abiertas=diferencias.filter(i=>!i.resolvedAt);
 return <div className="mx-auto max-w-4xl bg-white px-5 py-8 text-slate-900 sm:px-10 print:max-w-none print:p-0">
  <style>{`@page { size: A4; margin: 14mm; } @media print { body { background:white!important; } .no-print { display:none!important; } .acta-documento { box-shadow:none!important;border:none!important;padding:0!important; } .acta-tabla tr { break-inside:avoid; } .acta-firmas {break-inside:avoid;} .signature-button {display:none!important;} .signature-dialog {display:none!important;} }`}</style>
  <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
   <Link className="text-sm font-semibold text-kcj-red underline" href={`/dashboard/custodia/${acta.vehicleId}`}>Volver a entrega y recepción</Link>
   <ImprimirActaButton/>
  </div>
  <article className="acta-documento rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
   <header className="flex flex-wrap items-center justify-between gap-5 border-b-2 border-slate-900 pb-5">
    <div><KcjLogo size="large"/><p className="mt-2 text-xs font-semibold tracking-wide">KCJ PERÚ S.A.C. · CONTROL DE UNIDADES</p></div>
    <div className="text-right"><h1 className="text-xl font-black uppercase leading-7">Acta de {acta.kind==="ENTREGA"?"entrega":"recepción"}</h1><p className="text-xs">Código interno: {acta.id}</p><p className="text-sm font-semibold">{fecha(acta.at)} · Hora de Perú</p></div>
   </header>
   <p className="my-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-950">Acta histórica del registro digital. Las firmas manuscritas en pantalla se conservan como evidencia de aceptación presencial; no son firmas digitales certificadas y no acreditan por sí solas la identidad del firmante.</p>
   <section className="mb-5"><h2 className="mb-2 text-base font-bold">1. Identificación de la unidad</h2><div className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm"><p><b>Código:</b> {acta.vehicle.code}</p><p><b>Placa:</b> {acta.vehicle.plate}</p><p><b>Tipo:</b> {acta.vehicle.type}</p><p><b>Marca / modelo:</b> {ver([acta.vehicle.make,acta.vehicle.model].filter(Boolean).join(" "))}</p><p><b>Odómetro:</b> {acta.odometerKm===null?"No registrado":`${acta.odometerKm.toLocaleString("es-PE")} km`}</p><p><b>Combustible:</b> {acta.fuelPercent===null?"No registrado":`${acta.fuelPercent}%`}</p></div></section>
   <section className="mb-5"><h2 className="mb-2 text-base font-bold">2. Responsables y situación</h2><div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2"><p><b>Empresa / tercero:</b> {acta.party}</p><p><b>Lugar:</b> {ver(acta.location)}</p><p><b>Quien entrega:</b> {ver(acta.senderName)}</p><p><b>Quien recibe:</b> {ver(acta.receiverName)}</p></div><p className="mt-2 whitespace-pre-wrap text-sm"><b>Observaciones generales:</b> {acta.condition}</p>{entregada&&<p className="mt-2 text-xs text-slate-700"><b>Acta de entrega relacionada:</b> {entregada.id} · {fecha(entregada.at)}</p>}</section>
   <section className="mb-5"><h2 className="mb-2 text-base font-bold">3. Inventario del acta (instantánea histórica)</h2>
    {acta.items.length===0?<p className="rounded border border-amber-300 p-3 text-sm">Acta anterior sin inventario por componente: requiere regularización supervisada. No se atribuyen cantidades.</p>:
    <div className="overflow-x-auto"><table className="acta-tabla w-full border-collapse text-left text-[11px]"><thead><tr className="bg-slate-100"><th className="border p-2">Equipo / serie</th><th className="border p-2">Esperado</th><th className="border p-2">Registrado</th><th className="border p-2">Dañados</th><th className="border p-2">Estado</th></tr></thead><tbody>{acta.items.map(i=><tr key={i.id}><td className="border p-2"><b>{i.label}</b><p>{i.serial?`Serie: ${i.serial}`:i.itemCode}</p></td><td className="border p-2">{i.expectedQuantity}</td><td className="border p-2">{i.actualQuantity}</td><td className="border p-2">{i.damagedQuantity}</td><td className="border p-2">{i.condition}{i.discrepancy?i.resolvedAt?" · resuelta":" · pendiente":""}</td></tr>)}</tbody></table></div>}
   </section>
   {acta.contentVersion>=2&&acta.items.some(i=>i.photos.length>0)&&<section className="mb-5"><h2 className="mb-2 text-base font-bold">Evidencias fotográficas originales por componente</h2>
    <p className="mb-2 text-xs text-slate-600">Estas fotografías se registraron antes de las firmas y sus referencias están vinculadas a la huella del acta. Para proteger los archivos originales, el almacenamiento requiere controles de inmutabilidad independientes.</p>
    {acta.items.filter(i=>i.photos.length>0).map(i=><div key={i.id} className="mb-3 break-inside-avoid rounded-lg border p-3"><p className="mb-2 text-sm font-bold">{i.label} · {i.photos.length} foto(s)</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{i.photos.map((photo,j)=><a key={photo.id} href={`/api/actas/custodia/foto/${photo.id}`} target="_blank" rel="noopener noreferrer" className="block"><img src={`/api/actas/custodia/foto/${photo.id}`} alt={`Foto ${j+1} del componente ${i.label}`} className="h-28 w-full rounded border bg-slate-50 object-contain"/><span className="no-print text-xs text-kcj-red underline">Abrir foto {j+1}</span></a>)}</div></div>)}
   </section>}
   {acta.kind==="RECEPCION"&&<section className="mb-5"><h2 className="mb-2 text-base font-bold">4. Diferencias y conformidades</h2><p className="text-sm">Diferencias registradas: <b>{diferencias.length}</b> · Sin resolución: <b>{abiertas.length}</b>.</p>
    {diferencias.map(i=><div className="mt-2 rounded border p-2 text-xs" key={i.id}><b>{i.label}</b><p>Observación de recepción: {ver(i.notes)}</p><p>Resolución: {i.resolvedAt?`${fecha(i.resolvedAt)} · ${ver(i.resolutionReason)}`:"Pendiente de resolución documentada"}</p></div>)}
    <div className="mt-3 grid grid-cols-2 gap-4 text-xs"><p><b>Revisión Mantenimiento:</b> {acta.technicalVerifiedAt?fecha(acta.technicalVerifiedAt):"Pendiente"}</p><p><b>Revisión SSOMA:</b> {acta.safetyVerifiedAt?fecha(acta.safetyVerifiedAt):"Pendiente"}</p></div>
    <p className="mt-2 text-xs">Las revisiones no reemplazan otros requisitos de disponibilidad, habilitación y documentación operativa.</p>
   </section>}
   <section className="acta-firmas mt-8 border-t border-slate-300 pt-5"><h2 className="mb-3 text-base font-bold">{acta.kind==="ENTREGA"?"4":"5"}. Firmas de las partes</h2>
    <p className="mb-3 text-xs text-slate-600">La firma se solicita después de guardar el acta, para que las personas revisen el contenido exacto. Huella SHA-256 del contenido original (versión {acta.contentVersion}): <span className="break-all font-mono">{huella}</span></p>
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{(["ENTREGA","RECIBE"] as const).map(side=>{
     const signature=acta.signatures.find(s=>s.side===side);
     const signer=side==="ENTREGA"?acta.senderName:acta.receiverName;
     return <div key={side} className="rounded-lg border p-3 text-center text-xs"><h3 className="mb-2 font-bold">Firma de quien {side==="ENTREGA"?"entrega":"recibe"}</h3>
      {signature?<div className="space-y-1"><img src={`/api/actas/custodia/firma/${signature.id}`} alt={`Firma manuscrita de ${signature.signerName}`} className="mx-auto h-28 max-w-full object-contain"/><p className="font-semibold">{signature.signerName}</p><p>Capturada: {fecha(signature.signedAt)}</p><p>{signature.documentHash===huella?"Asociada al contenido original del acta":"ADVERTENCIA: huella de acta diferente; requiere revisión TI"}</p></div>:
      <div className="space-y-2">{puedeFirmar&&firmaVigente&&signer?<><FirmaCustodiaAmpliada eventId={acta.id} side={side} signerName={signer}/><div className="hidden h-24 border-b border-slate-500 print:block"/></>:<div className="h-28 border-b border-slate-500 pt-16 text-slate-600">Firma pendiente</div>}<p className="font-semibold">{ver(signer)}</p><p className="text-slate-600">{!firmaVigente&&puedeFirmar?"Acta histórica: no admite firmas retroactivas":"Pendiente de aceptación"}</p></div>}
     </div>;
    })}</div>
    <p className="mt-3 text-xs text-slate-600">La persona firma en un área ampliada en celular, tablet o computadora. El sistema conserva una imagen PNG privada, el usuario de Operaciones que la capturó y la fecha del servidor. La identidad no está certificada por el trazo.</p>
   </section>
   <footer className="mt-8 border-t pt-3 text-[10px] text-slate-600">Acta generada desde KCJ CONTROL · Documento interno para impresión · El historial digital y las evidencias permanecen en el sistema · No certifica firma o aceptación de terceros.</footer>
  </article>
 </div>;
}
