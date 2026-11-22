"use client";
import {useState} from "react";
import {EvidenceUploader} from "@/components/ui/EvidenceUploader";
import type {CatalogItem,ResultadoItem} from "@/lib/vehiculos-integrados";

export function ChecklistUnidadForm({vehicleId,items,eventId,action,mode="FLOTA",serviceId}:{vehicleId:string;items:CatalogItem[];eventId:string;action:(data:FormData)=>Promise<void>;mode?:"FLOTA"|"CONDUCTOR";serviceId?:string}){
 const [answers,setAnswers]=useState<Record<string,ResultadoItem|"">>({});
 const [notes,setNotes]=useState<Record<string,string>>({});
 const complete=items.every(x=>{const r=answers[x.code];return Boolean(r)&& (r==="CONFORME"||(r==="NO_APLICA"&&!x.mandatory&&notes[x.code]?.trim().length>=5)||((r==="OBSERVADO"||r==="NO_CONFORME")&&(notes[x.code]?.trim().length??0)>=5));});
 return <form action={action} className="card space-y-4">
  <div><h2 className="kcj-card-heading">{mode==="CONDUCTOR"?"Inspección diaria del conductor":"Checklist estructurado de la unidad"}</h2><p className="mt-1 text-sm text-slate-600">Cada componente debe inspeccionarse por separado. La luz y la alarma sonora de retroceso no se confunden. Si algo no corresponde, se explica por qué.</p></div>
  <input type="hidden" name="vehicleId" value={vehicleId}/><input type="hidden" name="clientEventId" value={eventId}/>{mode==="CONDUCTOR"&&<input type="hidden" name="serviceId" value={serviceId??""}/>}
  {mode==="FLOTA"?<label className="block text-sm font-semibold text-slate-700">Clase de revisión<select name="context" className="input mt-1" defaultValue="FICHA_INICIAL"><option value="FICHA_INICIAL">Inspección inicial de ficha vehicular</option><option value="REVISION_PROGRAMADA">Revisión programada en Flota</option></select></label>:<label className="block text-sm font-semibold">Kilometraje observado (si se dispone)<input className="input mt-1" type="number" min="0" step="1" name="kilometers" placeholder="Lectura del tablero"/></label>}
  <p className="text-xs text-slate-600">{items.length} componentes · versión de checklist 1 · Todos requieren un resultado</p>
  {Array.from(new Set(items.map(x=>x.category))).map(category=><section key={category} className="rounded-xl border border-kcj-border p-3 sm:p-4">
   <h3 className="mb-3 font-semibold text-kcj-charcoal">{category}</h3>
   <div className="space-y-4">{items.filter(x=>x.category===category).map(x=><div key={x.code} className="grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-[minmax(0,1fr)_220px]">
    <div><p className="text-sm font-medium text-slate-800">{x.label}</p><p className="text-xs text-slate-600">{x.mandatory?"Inspección requerida":"Sujeto al equipamiento aplicable"}{x.critical?" · Crítico si no conforme":""}</p></div>
    <div><label htmlFor={`r-${x.code}`} className="sr-only">Resultado de {x.label}</label>
     <select id={`r-${x.code}`} name={`resultado_${x.code}`} required value={answers[x.code]??""} onChange={e=>setAnswers(a=>({...a,[x.code]:e.target.value as ResultadoItem}))} className="input">
      <option value="">Seleccionar resultado</option><option value="CONFORME">Conforme</option><option value="OBSERVADO">Observado</option><option value="NO_CONFORME">No conforme</option>{!x.mandatory&&<option value="NO_APLICA">No aplica (justificar)</option>}
     </select>
     {answers[x.code]&&answers[x.code]!=="CONFORME"&&<textarea name={`detalle_${x.code}`} value={notes[x.code]??""} onChange={e=>setNotes(n=>({...n,[x.code]:e.target.value}))} minLength={5} required rows={2} className="input mt-2" placeholder="Motivo / observación obligatoria"/>}
    </div>
   </div>)}</div>
  </section>)}
  <div><p className="mb-2 text-sm font-semibold">Evidencia general de la inspección (opcional)</p><EvidenceUploader name={mode==="CONDUCTOR"?"evidenceKey":"overallEvidenceKey"} purpose={mode==="CONDUCTOR"?"CONNECT":"FLOTA"} photoCapture={mode==="CONDUCTOR"}/></div>
  <p className="text-xs text-amber-800">Si identificas un defecto crítico, se registrará un caso SSOMA y la unidad quedará sujeta a restricción hasta su cierre autorizado. {mode==="FLOTA"?"Este control inicial no reemplaza la inspección diaria del conductor.":"No conduzcas una unidad con defecto crítico; informa también por el canal operativo de seguridad."}</p>
  <button type="submit" className="btn" disabled={!complete} aria-disabled={!complete}>{mode==="CONDUCTOR"?"Enviar inspección diaria":"Guardar checklist e historial"}</button>
 </form>;
}
