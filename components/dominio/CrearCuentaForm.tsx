"use client";

import {useState} from "react";
import type {Option} from "@/components/ui/fields";

type Action=(data:FormData)=>Promise<void>;
const input="input";
const label="block space-y-1.5 text-sm font-medium text-slate-700";

/** Separar selección de rol/vínculo evita crear conductores sin ficha laboral. */
export function CrearCuentaForm({action,roles,workers,owners}:{action:Action;roles:Option[];workers:Option[];owners:Option[]}){
 const [role,setRole]=useState("");
 const [workerId,setWorkerId]=useState("");
 const [ownerId,setOwnerId]=useState("");
 const [password,setPassword]=useState("");
 const [confirm,setConfirm]=useState("");
 const needWorker=role==="CONDUCTOR";
 const needOwner=role==="PROPIETARIO";
 const blocked=(needWorker&&(!workers.length||!workerId))||(needOwner&&(!owners.length||!ownerId));
 return <form action={action} className="card overflow-hidden !p-0">
  <header className="border-b border-kcj-border px-5 py-5 sm:px-6"><h2 className="kcj-card-heading">Crear cuenta con contraseña asignada</h2><p className="mt-1 text-xs leading-5 text-kcj-muted">Una sola cuenta por trabajador. Registra primero su ficha en Colaboradores y después asígnale acceso.</p></header>
  <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
   <label className={label}>DNI / usuario *<input className={input} name="login" minLength={6} maxLength={32} autoComplete="off" required/></label>
   <label className={label}>Nombre para mostrar *<input className={input} name="displayName" minLength={3} maxLength={120} required/></label>
   <label className={label}>Función principal *<select className={input} name="role" value={role} required onChange={e=>{setRole(e.target.value);setWorkerId("");setOwnerId("");}}><option value="">Seleccionar función</option>{roles.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</select></label>
   {role!=="PROPIETARIO"&&<label className={label}>Vincular ficha laboral {needWorker?"*":"(recomendado)"}<select className={input} name="workerId" value={workerId} required={needWorker} onChange={e=>setWorkerId(e.target.value)}><option value="">{workers.length?"Seleccionar colaborador":"No hay colaboradores registrados"}</option>{workers.map(w=><option key={w.value} value={w.value}>{w.label}</option>)}</select></label>}
   {needOwner&&<label className={label}>Propietario vinculado *<select className={input} name="ownerId" value={ownerId} required onChange={e=>setOwnerId(e.target.value)}><option value="">{owners.length?"Seleccionar propietario":"No hay propietarios registrados"}</option>{owners.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>}
   <label className={label}>Contraseña asignada (mín. 16 caracteres) *<input className={input} type="password" name="password" minLength={16} maxLength={256} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
   <label className={label}>Confirmar contraseña *<input className={input} type="password" name="confirmPassword" minLength={16} maxLength={256} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/></label>
  </div>
  {needWorker&&!workers.length&&<p role="alert" className="mx-5 mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">No se puede crear un usuario Conductor sin ficha laboral. Primero ve a Colaboradores y registra al trabajador; si esa pantalla está bloqueada, TI debe resolver la migración de PostgreSQL.</p>}
  {needOwner&&!owners.length&&<p role="alert" className="mx-5 mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Primero registra al propietario en su módulo correspondiente.</p>}
  {password&&confirm&&password!==confirm&&<p role="alert" className="mx-5 mb-4 text-sm font-medium text-red-800">Las contraseñas no coinciden.</p>}
  <footer className="flex items-center justify-between gap-3 border-t border-kcj-border bg-[#F8F9FA] px-5 py-4 sm:px-6"><p className="text-xs text-kcj-muted">El usuario solo recibirá los permisos autorizados para su función.</p><button className="btn" type="submit" disabled={blocked||!role||!password||password!==confirm}>Crear cuenta</button></footer>
 </form>;
}
