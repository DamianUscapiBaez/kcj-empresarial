import Link from "next/link";
import {notFound} from "next/navigation";
import {requireUser} from "@/lib/auth";
import {tieneRol} from "@/lib/permisos-kcj";
import {dailyPauseReport} from "@/lib/consulta-pausas";
import {durationMinutes,localDateTime,todayInLima,parseDayInLima} from "@/lib/pausas-utils";

const labels:Record<string,string>={TRABAJANDO:"Trabajando",DESCANSANDO:"Descanso",SIN_PROGRAMACION:"Sin programación",CRUCE_ROSTER:"Revisar ROSTER",TRABAJO_Y_DESCANSO:"Trabajo y descanso",REGISTRADA:"Con pausa finalizada",EN_CURSO:"Pausa en curso",NO_REALIZADA:"No realizada",SIN_REGISTRO:"Sin registro",NO_APLICA:"No aplica",REVISAR_ROSTER:"Revisar guardia"};
export default async function PausasActivas({searchParams}:{searchParams:Promise<{fecha?:string}>}){
 const user=await requireUser();
 if(!tieneRol(user,"ADMIN","GERENCIA","OPERACIONES","JEFE_OPERACIONES","SSOMA","SALUD"))notFound();
 const {fecha}=await searchParams;
 const date=fecha??todayInLima();
 let valid=true;try{parseDayInLima(date);}catch{valid=false;}
 const data=valid?await dailyPauseReport(date):null;
 return <div className="space-y-5">
  <nav aria-label="Ruta de navegación" className="text-xs text-slate-500"><Link href="/dashboard" className="underline">Inicio</Link> / Línea de Mando / Pausas Activas</nav>
  <header className="rounded-2xl border border-kcj-border bg-white p-5 shadow-pane sm:p-6">
   <p className="kcj-eyebrow">Línea de Mando · Fatiga y Somnolencia</p>
   <h1 className="mt-2 text-2xl font-black text-kcj-charcoal">Control Maestro de Pausas Activas</h1>
   <p className="mt-2 text-sm text-slate-600">Ficha consolidada de todos los conductores por fecha, con situación del ROSTER y fotografías registradas. Los descansos no se contabilizan como incumplimientos.</p>
  </header>
  <section className="card space-y-3">
   <form method="GET" className="flex flex-wrap items-end gap-3" action="/dashboard/pausas-activas">
    <label className="text-sm font-semibold">Fecha del control<input type="date" name="fecha" defaultValue={valid?date:todayInLima()} className="input mt-1 block" required/></label>
    <button type="submit" className="btn">Consultar fecha</button>
    {data&&<a href={`/api/pausas-activas/pdf?fecha=${encodeURIComponent(date)}`} className="btn-secondary">Descargar ficha PDF vertical</a>}
   </form>
   {!valid&&<p role="alert" className="text-sm text-red-700">Fecha inválida. Selecciona un día válido.</p>}
  </section>
  {data&&<>
   <section aria-label="Resumen diario" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
    {[["Conductores",data.total],["Trabajando",data.working],["Descansando",data.resting],["Con pausa finalizada",data.withPauses],["Trabajando sin registro",data.withoutPauses]].map(([label,n])=><div key={label} className="card"><p className="text-2xl font-bold text-kcj-charcoal">{n}</p><p className="text-xs text-slate-600">{label}</p></div>)}
   </section>
   <section className="card space-y-3">
    <h2 className="kcj-card-heading">Registro de todos los conductores — {date}</h2>
    {data.rows.length===0?<p role="status" className="text-sm text-amber-800">No se encontraron conductores en la fecha consultada. Comprueba el padrón y las guardias publicadas; esto no confirma que se hayan realizado pausas.</p>:
    <div className="overflow-x-auto"><table className="w-full min-w-[1080px] border-collapse text-left text-xs">
     <thead><tr className="border-b-2 border-kcj-border bg-slate-50">{["Conductor / DNI","Código unidad","Placa","Servicio","ROSTER","Fecha y hora","Duración","Estado y motivo","Foto"].map(h=><th key={h} scope="col" className="px-2 py-3 font-semibold">{h}</th>)}</tr></thead>
     <tbody>{data.rows.flatMap(row=>(row.pauses.length?row.pauses:[null]).map((p,i)=>{
      const state=p?.status?labels[p.status]??p.status:labels[row.state]??row.state;
      const time=p?.startedAt?localDateTime(p.startedAt):p?.status==="NO_REALIZADA"?`Motivo comunicado: ${localDateTime(p.createdAt)}`: "—";
      const end=p?.completedAt?` / ${localDateTime(p.completedAt)}`:p?.dueAt?` / previsto ${localDateTime(p.dueAt)}`:"";
      return <tr key={`${row.workerId}-${p?.id??"none"}-${i}`} className="border-b border-kcj-border align-top">
       <td className="px-2 py-3"><strong className="block">{row.name}</strong><span className="text-slate-500">{row.document}</span></td>
       <td className="px-2 py-3">{p?.unitCode??row.unitCode??"—"}</td><td className="px-2 py-3">{p?.plate??row.plate??"—"}</td><td className="px-2 py-3">{p?.serviceCode??row.serviceCode??"—"}</td>
       <td className="px-2 py-3">{labels[row.situation]}</td><td className="px-2 py-3">{time}{end}</td>
       <td className="px-2 py-3">{p?.completedAt?`${durationMinutes(p.startedAt,p.completedAt)} min`:p?.status==="EN_CURSO"?"En curso":"—"}</td>
       <td className="px-2 py-3">{state}{p?.missedReason&&<p className="mt-1 text-slate-600">{p.missedReason}</p>}</td>
       <td className="px-2 py-3">{p?.evidenceKey?<a href={`/api/pausas-activas/evidencia?id=${encodeURIComponent(p.id)}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-kcj-red underline">Ver foto</a>:"—"}</td>
      </tr>;
     }))}</tbody>
    </table></div>}
    <p className="text-xs text-slate-600">Las pausas en curso no equivalen a pausas verificadas. La ausencia de una guardia publicada no se considera incumplimiento. Las fechas y horas corresponden a Perú.</p>
   </section>
  </>}
 </div>;
}
