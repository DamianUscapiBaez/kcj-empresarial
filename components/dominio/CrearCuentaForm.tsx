"use client";
import {useState} from "react";
import type {Option} from "@/components/ui/fields";
type Action=(data:FormData)=>Promise<void>;
const input="input",label="block space-y-1.5 text-sm font-medium text-slate-700";
/** No se solicita ni función, ni usuario, ni contraseña para trabajadores ya registrados. */
export function ActivarCuentaTrabajadorForm({action,workers}:{action:Action;workers:Option[]}){
 const [worker,setWorker]=useState("");
 return <form action={action} className="card overflow-hidden !p-0">
  <header className="border-b border-kcj-border px-5 py-5 sm:px-6"><h2 className="kcj-card-heading">Crear cuenta de acceso para este colaborador</h2><p className="mt-1 text-xs leading-5 text-kcj-muted">Solo para fichas existentes sin cuenta. DNI como usuario y contraseña inicial, con permisos derivados de sus áreas. No duplica la ficha.</p></header>
  <div className="px-5 py-5 sm:px-6"><label className={label}>Colaborador *<select className={input} name="workerId" value={worker} onChange={e=>setWorker(e.target.value)} required><option value="">{workers.length?"Selecciona su ficha laboral":"No hay colaboradores disponibles"}</option>{workers.map(w=><option key={w.value} value={w.value}>{w.label}</option>)}</select></label></div>
  <p className="px-5 pb-3 text-xs text-amber-900">Por seguridad, se recomienda cambiar la contraseña inicial de DNI cuanto antes. Elegir panel después de iniciar sesión no requiere nueva contraseña.</p>
  <footer className="flex justify-end border-t border-kcj-border px-5 py-4 sm:px-6"><button className="btn" type="submit" disabled={!worker}>Crear cuenta desde DNI</button></footer>
 </form>;
}
/** Excepción administrativa: cuentas sin ficha de trabajador (bootstrap y propietarios). */
export function CrearCuentaForm({action,roles,owners}:{action:Action;roles:Option[];owners:Option[]}){
 const [role,setRole]=useState("");const [owner,setOwner]=useState("");const [pass,setPass]=useState("");const [confirm,setConfirm]=useState("");
 const blocked=role==="PROPIETARIO"&&(!owners.length||!owner);
 return <form action={action} className="card overflow-hidden !p-0">
  <header className="border-b border-kcj-border px-5 py-5 sm:px-6"><h2 className="kcj-card-heading">Crear cuenta especial con contraseña asignada</h2><p className="mt-1 text-xs leading-5 text-kcj-muted">Solo cuentas ADMIN especiales sin ficha laboral. Las cuentas de propietarios se crean en Propietarios; las de colaboradores desde el DNI.</p></header>
  <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
   <label className={label}>Identificador de cuenta especial *<input className={input} name="login" minLength={6} maxLength={32} autoComplete="off" required/></label>
   <label className={label}>Nombre para mostrar *<input className={`${input} uppercase`} name="displayName" onChange={e=>{e.currentTarget.value=e.currentTarget.value.toLocaleUpperCase("es-PE");}} minLength={3} maxLength={120} required/></label>
   <label className={label}>Tipo de cuenta especial *<select className={input} name="role" value={role} required onChange={e=>{setRole(e.target.value);setOwner("");}}><option value="">Seleccionar</option>{roles.filter(r=>r.value==="ADMIN").map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</select></label>
   {role==="PROPIETARIO"&&<label className={label}>Propietario vinculado *<select className={input} name="ownerId" value={owner} onChange={e=>setOwner(e.target.value)} required><option value="">{owners.length?"Seleccionar":"Sin propietarios"}</option>{owners.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>}
   <label className={label}>Contraseña especial (mín. 8 caracteres) *<input className={input} type="password" name="password" minLength={8} maxLength={256} value={pass} onChange={e=>setPass(e.target.value)} required/></label>
   <label className={label}>Confirmar contraseña *<input className={input} type="password" name="confirmPassword" minLength={8} maxLength={256} value={confirm} onChange={e=>setConfirm(e.target.value)} required/></label>
  </div>
  {pass&&confirm&&pass!==confirm&&<p role="alert" className="mx-5 mb-4 text-sm text-red-800">Las contraseñas no coinciden.</p>}
  <footer className="flex justify-end border-t border-kcj-border bg-[#F8F9FA] px-5 py-4 sm:px-6"><button className="btn" type="submit" disabled={blocked||!role||!pass||pass!==confirm}>Crear cuenta especial</button></footer>
 </form>;
}
