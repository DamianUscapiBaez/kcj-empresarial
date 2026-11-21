import type { ReactNode } from "react";
import {EvidenceUploader} from "@/components/ui/EvidenceUploader";
import {UIIcon} from "@/components/ui/ModuleIcon";

export interface Option {value:string;label:string}
export type FieldType="text"|"number"|"date"|"datetime-local"|"password"|"textarea"|"select"|"checkbox"|"evidence"|"hidden";
export interface FieldSpec {
 name:string;label:string;evidencePurpose?:"FLOTA"|"MANTENIMIENTO"|"SSOMA"|"HOMOLOGACION"|"RRHH"|"CUSTODIA"|"CONNECT";
 type?:FieldType;required?:boolean;options?:Option[];value?:string;placeholder?:string;min?:number;step?:number;
}
/** Usa la misma Server Action; solo mejora su presentación y accesibilidad. */
export function RecordForm({title,action,fields,submit="Guardar",children}:{title:string;action:(formData:FormData)=>Promise<void>;fields:FieldSpec[];submit?:string;children?:ReactNode}){
 return <form action={action} className="card overflow-hidden !p-0">
  <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
   <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-kcj-red"><UIIcon name="clipboard" size={20}/></span>
   <div className="min-w-0 flex-1"><h2 className="kcj-card-heading">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">Completa la información y guarda el registro en el sistema.</p></div>
  </div>
  <div className="grid gap-x-5 gap-y-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
   {fields.map(f=>{
    if(f.type==="hidden")return <input key={f.name} type="hidden" name={f.name} value={f.value??""}/>;
    if(f.type==="checkbox")return <label key={f.name} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-700"><input type="checkbox" name={f.name} defaultChecked={f.value==="true"} className="h-4 w-4 rounded border-slate-300 accent-kcj-red"/><span>{f.label}{f.required&&<span className="ml-1 text-kcj-red">*</span>}</span></label>;
    return <label key={f.name} className={`block min-w-0 space-y-1.5 text-sm font-medium text-slate-700 ${f.type==="textarea"?"sm:col-span-2":""}`}>
     <span className="block">{f.label}{f.required&&<span aria-label="obligatorio" className="ml-1 text-kcj-red">*</span>}</span>
     {f.type==="evidence"?<EvidenceUploader name={f.name} required={f.required} purpose={f.evidencePurpose??"FLOTA"}/>
      :f.type==="select"?<select name={f.name} required={f.required} defaultValue={f.value??""} className="input"><option value="">Seleccionar opción</option>{f.options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
      :f.type==="textarea"?<textarea name={f.name} rows={3} required={f.required} className="input min-h-[112px] resize-y" placeholder={f.placeholder??"Escribe los detalles correspondientes"}/>
      :<input className="input" name={f.name} type={f.type??"text"} required={f.required} placeholder={f.placeholder} min={f.min} step={f.step} defaultValue={f.value}/>}
    </label>;
   })}
   {children&&<div className="sm:col-span-2">{children}</div>}
  </div>
  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
   <p className="text-xs text-slate-500">Los campos marcados con * son obligatorios.</p>
   <button type="submit" className="btn"><UIIcon name="check" size={17}/>{submit}</button>
  </div>
 </form>;
}
export interface TableRow {id:string;data:Record<string,string>;actions?:ReactNode}
export function DataTable({title,rows}:{title:string;rows:TableRow[]}){
 const headers=rows.length?Object.keys(rows[0].data):[];
 return <section className="card overflow-hidden !p-0">
  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
   <div><h2 className="kcj-card-heading">{title}</h2><p className="mt-1 text-xs text-slate-500">Consulta y seguimiento de la información registrada</p></div>
   <span className="badge tabular-nums">{rows.length} {rows.length===1?"registro":"registros"}</span>
  </header>
  {rows.length===0?<div className="flex flex-col items-center px-5 py-10 text-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400"><UIIcon name="folder" size={25}/></span><p className="mt-4 font-semibold text-slate-700">Aún no hay registros</p><p className="mt-1 max-w-sm text-sm text-slate-500">Los datos guardados aparecerán aquí. Utiliza el formulario correspondiente para registrar información.</p></div>
   :<div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><caption className="sr-only">{title}</caption><thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><tr>{headers.map(k=><th scope="col" key={k} className="whitespace-nowrap px-4 py-3">{k}</th>)}<th scope="col" className="whitespace-nowrap px-4 py-3">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(r=><tr key={r.id} className="align-middle transition hover:bg-slate-50/80">{headers.map(k=><td key={k} className="whitespace-nowrap px-4 py-3.5 text-slate-700">{r.data[k]??"—"}</td>)}<td className="whitespace-nowrap px-4 py-3">{r.actions??<span className="text-slate-400">—</span>}</td></tr>)}</tbody></table></div>}
 </section>;
}
export function InlineAction({action,fields,label}:{action:(data:FormData)=>Promise<void>;fields:{name:string;value:string}[];label:string}){
 return <form action={action} className="inline-block">{fields.map(f=><input key={f.name} type="hidden" name={f.name} value={f.value}/>)}<button type="submit" className="kcj-focus rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-kcj-charcoal transition hover:border-kcj-red/40 hover:bg-red-50 hover:text-kcj-red">{label}</button></form>;
}
