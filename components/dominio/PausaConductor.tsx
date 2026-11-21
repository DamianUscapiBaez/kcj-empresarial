import {randomUUID} from "node:crypto";
import {registrarPausaActiva,finalizarPausaActiva,informarPausaNoRealizada} from "@/app/actions-pausas";
import {EvidenceUploader} from "@/components/ui/EvidenceUploader";
import {InlineAction} from "@/components/ui/fields";
import {localDateTime,durationMinutes} from "@/lib/pausas-utils";
import {prisma} from "@/lib/prisma";

export async function PausaConductor({workerId}:{workerId:string}){
 const records=await prisma.activePause.findMany({where:{workerId},orderBy:{createdAt:"desc"},take:12});
 return <section className="space-y-4">
  <div className="card space-y-3">
   <h2 className="kcj-card-heading">Mis pausas activas</h2>
   <p className="text-sm text-slate-700">Recordatorio: detén la unidad en un lugar seguro y realiza estiramientos o movilidad suave durante 5 a 10 minutos. Registra tu fotografía al iniciar la pausa. Nunca uses el celular mientras conduces.</p>
   <form action={registrarPausaActiva} className="space-y-3">
    <EvidenceUploader name="evidenceKey" purpose="CONNECT" required photoCapture/>
    <input type="hidden" name="clientEventId" value={randomUUID()}/>
    <button type="submit" className="btn">Enviar fotografía e iniciar pausa de 5 min</button>
    <p className="text-xs text-slate-600">La fecha y hora se capturan en el servidor cuando se confirma el envío. No se pueden editar.</p>
   </form>
   <details className="rounded-lg border border-kcj-border p-3"><summary className="cursor-pointer text-sm font-semibold">Informar por qué no realicé la pausa</summary>
    <form action={informarPausaNoRealizada} className="mt-3 space-y-2">
     <label className="block text-sm">Motivo de no realización<textarea name="reason" required minLength={10} maxLength={500} rows={3} className="input mt-1"/></label>
     <input type="hidden" name="clientEventId" value={randomUUID()}/>
     <button type="submit" className="btn">Enviar motivo</button>
    </form>
   </details>
  </div>
  <div className="card space-y-3"><h2 className="kcj-card-heading">Mis registros recientes</h2>
   {records.length===0?<p className="text-sm text-slate-600">Todavía no hay registros de pausas.</p>:
   <div className="space-y-2">{records.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-3 text-sm">
    <div><p className="font-semibold">{p.status.replaceAll("_"," ")}</p><p className="text-xs text-slate-600">{localDateTime(p.startedAt??p.createdAt)} · {p.completedAt?`${durationMinutes(p.startedAt,p.completedAt)} min registrados`:p.status==="EN_CURSO"?`Fin previsto: ${localDateTime(p.dueAt)}`:p.missedReason??"—"}</p></div>
    {p.status==="EN_CURSO"&&<InlineAction action={finalizarPausaActiva} fields={[{name:"id",value:p.id}]} label="Confirmar término (después de 5 min)"/>}
   </div>)}</div>}
  </div>
 </section>;
}
