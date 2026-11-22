"use client";
import {useState} from "react";
import type {Option} from "@/components/ui/fields";

type Action=(data:FormData)=>Promise<void>;
type WorkerRow={id:string;name:string;document:string;area:string;secondaryArea:string|null;active:boolean};

const input="input";
const label="block space-y-1.5 text-sm font-medium text-slate-700";
function AreaSelect({name,areas,value,onChange,optional=false,excluded}:{name:string;areas:Option[];value:string;onChange:(v:string)=>void;optional?:boolean;excluded?:string}){
 return <select className={input} name={name} required={!optional} value={value} onChange={e=>onChange(e.target.value)}>
  <option value="">{optional?"Ninguna (solo un área)":"Selecciona el área de trabajo"}</option>
  {areas.filter(x=>x.value!==excluded||x.value===value).map(x=><option value={x.value} key={x.value}>{x.label}</option>)}
 </select>;
}
function Intro({title,subtitle}:{title:string;subtitle:string}){return <div className="border-b border-kcj-border px-5 py-5 sm:px-6"><h2 className="kcj-card-heading">{title}</h2><p className="mt-1 text-xs leading-5 text-kcj-muted">{subtitle}</p></div>}
function Submit({text,disabled=false}:{text:string;disabled?:boolean}){return <div className="flex justify-end border-t border-kcj-border bg-[#F8F9FA] px-5 py-4 sm:px-6"><button className="btn" disabled={disabled} type="submit">{text}</button></div>}

export function RegistrarColaboradorForm({action,areas,puedeCrearAcceso=false}:{action:Action;areas:Option[];puedeCrearAcceso?:boolean}){
 const [principal,setPrincipal]=useState("");const [secundaria,setSecundaria]=useState("");const [crearAcceso,setCrearAcceso]=useState(false);
 return <form className="card overflow-hidden !p-0" action={action}>
  <Intro title="Registrar colaborador" subtitle="Una ficha por persona. Selecciona el área de trabajo principal y, solo si corresponde, una segunda área."/>
  <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
   <label className={label}>DNI / documento *<input className={input} name="document" minLength={6} maxLength={16} required autoComplete="off"/></label>
   <label className={label}>Nombres y apellidos *<input className={input} name="name" minLength={3} maxLength={150} required autoComplete="name"/></label>
   <label className={label}>Primera área de trabajo (principal) *<AreaSelect name="area" areas={areas} value={principal} onChange={v=>{setPrincipal(v);if(v===secundaria)setSecundaria("");}}/></label>
   <label className={label}>Segunda área de trabajo (opcional)<AreaSelect name="secondaryArea" areas={areas} value={secundaria} onChange={setSecundaria} optional excluded={principal}/></label>
   <label className={label}>N.º de licencia (si conduce)<input className={input} name="license"/></label>
   <label className={label}>Vencimiento de licencia<input className={input} type="date" name="licenseExpires"/></label>
  </div>
  {puedeCrearAcceso&&<div className="mx-5 mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:mx-6">
   <label className="flex items-center gap-3 text-sm font-semibold text-slate-800"><input type="checkbox" name="crearAcceso" checked={crearAcceso} onChange={e=>setCrearAcceso(e.target.checked)} className="h-4 w-4 accent-kcj-red"/>Crear también su cuenta para ingresar al sistema (ADMIN)</label>
   <p className="mt-2 text-xs text-slate-700">La ficha y la cuenta se registran juntas o no se registra ninguna. El área laboral no otorga permisos automáticamente: selecciona expresamente la función principal del usuario.</p>
   {crearAcceso&&<div className="mt-4 grid gap-4 sm:grid-cols-2">
    <label className={label}>Nombre de usuario *<input className={input} name="login" minLength={6} maxLength={32} required autoComplete="off" placeholder="Ej. kcj.conductor01"/></label>
    <label className={label}>Función principal *<select className={input} name="role" required defaultValue=""><option value="">Selecciona el cargo autorizado</option>{["CONDUCTOR","OPERACIONES","JEFE_OPERACIONES","SSOMA","MANTENIMIENTO","RRHH","SALUD","GERENCIA","HOMOLOGACION","INSTRUCTOR","ALMACEN","ADMIN"].map(r=><option key={r} value={r}>{r}</option>)}</select></label>
    <label className={label}>Contraseña inicial (mín. 16 caracteres) *<input className={input} type="password" name="password" minLength={16} maxLength={256} autoComplete="new-password" required/></label>
    <label className={label}>Confirmar contraseña *<input className={input} type="password" name="confirmPassword" minLength={16} maxLength={256} autoComplete="new-password" required/></label>
   </div>}
  </div>}
  <p className="px-5 pb-4 text-xs text-slate-600">Las áreas de trabajo no asignan permisos automáticamente. Centro de Control gestiona los accesos desde Usuarios.</p>
  <Submit text={crearAcceso?"Registrar colaborador y crear cuenta":"Registrar colaborador"} disabled={!areas.length}/>
 </form>;
}

export function ActualizarColaboradorForm({action,areas,people}:{action:Action;areas:Option[];people:WorkerRow[]}){
 const [id,setId]=useState("");const selected=people.find(x=>x.id===id);
 const [principal,setPrincipal]=useState("");const [secundaria,setSecundaria]=useState("");const [estado,setEstado]=useState("ACTIVO");
 const choices=areas.concat(selected?.area&&!areas.some(x=>x.value===selected.area)?[{value:selected.area,label:`${selected.area} (área histórica)`}]:[],selected?.secondaryArea&&!areas.some(x=>x.value===selected.secondaryArea)?[{value:selected.secondaryArea,label:`${selected.secondaryArea} (área histórica)`}]:[]);
 return <form className="card overflow-hidden !p-0" action={action}>
  <Intro title="Actualizar colaborador" subtitle="Muestra sus datos actuales y permite cambiar una o ambas áreas, o solo su estado laboral."/>
  <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
   <label className={`${label} sm:col-span-2`}>Colaborador *
    <select required name="id" className={input} value={id} onChange={e=>{const v=e.target.value;const w=people.find(p=>p.id===v);setId(v);setPrincipal(w?.area??"");setSecundaria(w?.secondaryArea??"");setEstado(w?.active?"ACTIVO":"INACTIVO");}}>
     <option value="">Selecciona un colaborador</option>
     {people.map(p=><option key={p.id} value={p.id}>{p.name} · {p.document}</option>)}
    </select>
   </label>
   {selected&&<div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">Asignación actual: <strong>{selected.area}</strong>{selected.secondaryArea?` + ${selected.secondaryArea}`:""} · {selected.active?"Activo":"Inactivo"}</div>}
   <label className={label}>Primera área de trabajo (principal) *<AreaSelect name="area" areas={choices} value={principal} onChange={v=>{setPrincipal(v);if(v===secundaria)setSecundaria("");}}/></label>
   <label className={label}>Segunda área de trabajo (opcional)<AreaSelect name="secondaryArea" areas={choices} value={secundaria} onChange={setSecundaria} optional excluded={principal}/></label>
   <label className={label}>Estado laboral *<select name="status" className={input} required value={estado} onChange={e=>setEstado(e.target.value)}><option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo (revoca acceso)</option></select></label>
   <label className={label}>Motivo del cambio *<input className={input} name="reason" minLength={5} maxLength={500} required placeholder="Ej.: Actualización de asignación laboral"/></label>
  </div>
  <p className="px-5 pb-4 text-xs text-slate-600">Si solo cambia el estado, las dos áreas se mantienen. Los cambios se registran en auditoría; no alteran automáticamente los permisos.</p>
  <Submit text="Guardar cambios del colaborador" disabled={!id||!areas.length}/>
 </form>;
}
