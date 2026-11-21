"use client";

import {useState} from "react";
import {UIIcon} from "@/components/ui/ModuleIcon";

type Trabajador = {id:string; name:string; document:string; area:string};
type Servicio = {id:string; code:string; route:string; workerId:string|null; status:string};

/** El navegador muestra el área; el servidor siempre la vuelve a consultar en PostgreSQL. */
export function TareoRegistroForm({action,trabajadores,servicios}:{
  action:(formData:FormData)=>Promise<void>;
  trabajadores:Trabajador[];
  servicios:Servicio[];
}) {
  const [workerId,setWorkerId]=useState("");
  const [origin,setOrigin]=useState("SERVICIO");
  const [serviceId,setServiceId]=useState("");
  const persona=trabajadores.find(t=>t.id===workerId);
  const disponibles=servicios.filter(s=>s.workerId===workerId);
  const isService=origin==="SERVICIO";
  return <form action={action} className="card overflow-hidden !p-0">
    <div className="flex items-start gap-3 border-b border-kcj-border px-5 py-5 sm:px-6">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-kcj-redSoft text-kcj-red"><UIIcon name="clipboard" size={20}/></span>
      <div className="min-w-0 flex-1"><h2 className="kcj-card-heading">Registrar horas realmente trabajadas</h2><p className="mt-1 text-xs leading-5 text-kcj-muted">Área vinculada a la ficha laboral y origen verificable. ROSTER no genera horas automáticamente.</p></div>
    </div>
    <div className="grid gap-x-5 gap-y-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
      <label className="block min-w-0 space-y-1.5 text-sm font-medium text-slate-700"><span className="block">Trabajador <span className="text-kcj-red">*</span></span>
        <select name="workerId" className="input" required value={workerId} onChange={e=>{setWorkerId(e.target.value);setServiceId("");}}>
          <option value="">Seleccionar trabajador</option>{trabajadores.map(t=><option value={t.id} key={t.id}>{t.name} · {t.document}</option>)}
        </select>
      </label>
      <label className="block min-w-0 space-y-1.5 text-sm font-medium text-slate-700"><span className="block">Área (de la ficha del trabajador)</span>
        <input className="input bg-slate-100 text-slate-600" value={persona?.area??"Seleccione un trabajador"} readOnly aria-label="Área obtenida automáticamente de la ficha laboral"/>
      </label>
      <label className="block min-w-0 space-y-1.5 text-sm font-medium text-slate-700"><span className="block">Inicio real (hora Perú) <span className="text-kcj-red">*</span></span><input className="input" type="datetime-local" name="startsAt" required/></label>
      <label className="block min-w-0 space-y-1.5 text-sm font-medium text-slate-700"><span className="block">Fin real (hora Perú) <span className="text-kcj-red">*</span></span><input className="input" type="datetime-local" name="endsAt" required/></label>
      <label className="block min-w-0 space-y-1.5 text-sm font-medium text-slate-700"><span className="block">Origen del registro <span className="text-kcj-red">*</span></span>
        <select name="origin" value={origin} onChange={e=>{setOrigin(e.target.value);setServiceId("");}} className="input" required>
          <option value="SERVICIO">Servicio registrado en Operaciones / KCJ CONNECT</option>
          <option value="REGISTRO_INTERNO">Registro operativo interno (requiere justificación)</option>
        </select>
      </label>
      {isService?<label className="block min-w-0 space-y-1.5 text-sm font-medium text-slate-700"><span className="block">Servicio asignado al trabajador <span className="text-kcj-red">*</span></span>
        <select className="input" name="serviceId" required disabled={!workerId||disponibles.length===0} value={serviceId} onChange={e=>setServiceId(e.target.value)}>
          <option value="">{!workerId?"Seleccione primero un trabajador":disponibles.length?"Seleccione un servicio":"Sin servicios iniciados o finalizados"}</option>
          {disponibles.map(s=><option value={s.id} key={s.id}>{s.code} · {s.route} ({s.status})</option>)}
        </select>
        {workerId&&disponibles.length===0&&<span className="block text-xs font-normal text-amber-700">No hay servicios registrados para este trabajador. Si corresponde otra actividad real, elija «Registro operativo interno» y justifíquela.</span>}
      </label>:<label className="block min-w-0 space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2"><span className="block">Motivo y respaldo del registro interno <span className="text-kcj-red">*</span></span>
        <textarea name="reason" className="input min-h-[95px]" required minLength={12} maxLength={500} placeholder="Describa la actividad, documento o control que acredita las horas reales; RR. HH. verificará el registro."/>
      </label>}
      {trabajadores.length===0&&<p role="status" className="text-sm text-amber-800 sm:col-span-2">No hay trabajadores activos. Primero registra el personal en Personal.</p>}
      <p className="text-xs leading-5 text-kcj-muted sm:col-span-2">El registro queda pendiente de validación por RR. HH. y no puede solaparse con otro tareo del trabajador. La fuente y el área se validan nuevamente en el servidor.</p>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-kcj-border bg-[#F8F9FA] px-5 py-4 sm:px-6"><p className="text-xs text-kcj-muted">Los campos marcados con * son obligatorios.</p><button type="submit" className="btn" disabled={!workerId||(isService&&!serviceId)}><UIIcon name="check" size={17}/>Registrar horas trabajadas</button></div>
  </form>;
}
