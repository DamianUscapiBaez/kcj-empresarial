"use client";
import {useState} from "react";
import type {ChangeEvent} from "react";

export interface CuentaEditable {id:string;login:string;displayName:string;}
/** La selección carga los valores actuales para evitar sobrescribir datos por error. */
export function AdminEditarCuentaForm({cuentas,action}:{cuentas:CuentaEditable[];action:(form:FormData)=>Promise<void>}){
 const [id,setId]=useState("");
 const [login,setLogin]=useState("");
 const [displayName,setDisplayName]=useState("");
 const selectAccount=(e:ChangeEvent<HTMLSelectElement>)=>{
  const target=cuentas.find(c=>c.id===e.target.value);
  setId(target?.id??"");setLogin(target?.login??"");setDisplayName(target?.displayName??"");
 };
 const original=cuentas.find(c=>c.id===id);
 const cambiado=Boolean(original&&(original.login!==login||original.displayName!==displayName));
 return <form action={action} className="card space-y-4" aria-label="Editar datos de usuario">
  <div><h2 className="kcj-card-heading">Editar usuario y nombre para mostrar</h2><p className="mt-1 text-xs text-kcj-muted">Selecciona una cuenta para cargar sus datos existentes. Solo se modificarán usuario y nombre visible; la contraseña y los registros históricos se conservan.</p></div>
  <div className="grid gap-4 sm:grid-cols-2">
   <label className="block min-w-0 space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">Cuenta a editar *
    <select className="input" name="userId" value={id} onChange={selectAccount} required><option value="">Seleccionar cuenta</option>{cuentas.map(c=><option key={c.id} value={c.id}>{c.displayName} · {c.login}</option>)}</select>
   </label>
   <label className="block min-w-0 space-y-1.5 text-sm font-medium text-slate-700">Usuario / DNI *
    <input className="input" name="login" value={login} onChange={e=>setLogin(e.target.value)} minLength={6} maxLength={32} required disabled={!id}/>
   </label>
   <label className="block min-w-0 space-y-1.5 text-sm font-medium text-slate-700">Nombre visible *
    <input className="input uppercase" name="displayName" value={displayName} onChange={e=>setDisplayName(e.target.value.toLocaleUpperCase("es-PE"))} minLength={3} maxLength={120} required disabled={!id}/>
   </label>
   <label className="block min-w-0 space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">Motivo del cambio *
    <textarea className="input" name="reason" required minLength={10} maxLength={500} rows={2} placeholder="Indica por qué se actualizan estos datos"/>
   </label>
   <label className="block min-w-0 space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">Contraseña actual de ADMIN *
    <input className="input" type="password" name="adminPassword" autoComplete="current-password" required minLength={8}/>
   </label>
  </div>
  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-kcj-border pt-4"><p className="text-xs text-kcj-muted">Cambiar el usuario cierra las sesiones anteriores del colaborador.</p><button type="submit" className="btn" disabled={!cambiado}>Guardar cambios de acceso</button></div>
 </form>;
}
