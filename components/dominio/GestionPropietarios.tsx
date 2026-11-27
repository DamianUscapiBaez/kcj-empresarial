"use client";
import Link from "next/link";
import {useActionState,useState} from "react";
import type {EstadoAccesoPropietario} from "@/app/actions-propietarios";
import {crearAccesoPropietario,restablecerAccesoPropietario} from "@/app/actions-propietarios";
import {RecordForm} from "@/components/ui/fields";
import {actualizarPropietario,vincularUnidadPropietario,desvincularUnidadPropietario} from "@/app/actions-operativas";

type Unidad={id:string;plate:string;code:string;type:string};
type Owner={id:string;document:string;name:string;contact:string|null;vehicles:Unidad[];users:{id:string;role:string;active:boolean;login:string}[]};
const inicial:EstadoAccesoPropietario={ok:false,message:"",login:"",temporaryPassword:""};
function ControlAcceso({propietario,existe}:{propietario:Owner;existe:boolean}){
 const [creado,accionCrear,creando]=useActionState(crearAccesoPropietario,inicial);
 const [restablecido,accionRestablecer,restableciendo]=useActionState(restablecerAccesoPropietario,inicial);
 // Tras revalidar, "existe" cambia a true: conservar la clave mostrada una sola vez.
 const estado=existe?(restablecido.ok?restablecido:creado.ok?creado:restablecido):creado;
 return <section className="rounded-xl border border-kcj-border bg-white p-4 space-y-3">
  <h3 className="font-bold text-kcj-charcoal">Cuenta de acceso del propietario</h3>
  <p className="text-sm text-slate-600">{existe?"Esta ficha ya tiene una cuenta. Puedes restablecer su clave de forma segura si el propietario perdió el acceso.":"Si existe una cuenta laboral con el mismo DNI, se habilita el perfil sin cambiar la contraseña. Si es externo, se crea una cuenta de proveedor."}</p>
  <p className="text-sm font-semibold">Usuario: {propietario.users[0]?.login??`prop-${propietario.document.toLowerCase().replace(/\s+/g,"")}`}</p>
  <form action={existe?accionRestablecer:accionCrear} className="flex flex-wrap items-end gap-3">
   <input type="hidden" name="ownerId" value={propietario.id}/>
   {!existe&&<label className="text-sm"><input type="checkbox" name="confirmIdentity"/> He verificado el DNI y la titularidad; si existe cuenta laboral, vincular el perfil a ella.</label>}
   {(!existe||propietario.users[0]?.role==="PROPIETARIO")?<button className="btn" type="submit" disabled={existe?restableciendo:creando}>{existe?"Restablecer acceso":"Habilitar perfil de proveedor"}</button>:<p className="text-sm">Cuenta laboral vinculada. La contraseña se administra en Acceso y usuarios.</p>}
  </form>
  {estado.message&&<div role="status" className={`rounded-lg border px-3 py-2 text-sm ${estado.ok?"border-emerald-300 bg-emerald-50 text-emerald-950":"border-amber-300 bg-amber-50 text-amber-950"}`}>
   <p>{estado.message}</p>
   {estado.ok&&estado.temporaryPassword&&<div className="mt-3 space-y-1"><p><strong>Usuario:</strong> <span className="font-mono">{estado.login}</span></p><p><strong>Clave temporal (mostrar una sola vez):</strong> <span className="break-all font-mono">{estado.temporaryPassword}</span></p><p className="text-xs">Entrega estas credenciales al propietario por un canal seguro. No tomes capturas públicas: al abandonar esta pantalla no podrás volver a consultar la clave.</p></div>}
  </div>}
  <p className="text-xs text-slate-500">Por seguridad las contraseñas actuales no pueden consultarse. La clave temporal exige un cambio en el primer ingreso.</p>
 </section>;
}
export function GestionPropietarios({owners,freeVehicles,admin}:{owners:Owner[];freeVehicles:Unidad[];admin:boolean}){
 const [current,setCurrent]=useState(owners[0]?.id??"");
 const elegido=owners.find(o=>o.id===current);
 const disponibles=freeVehicles.map(v=>({value:v.id,label:`${v.plate} · ${v.code} (${v.type})`}));
 return <section className="space-y-4">
  <div className="card space-y-3"><h2 className="kcj-card-heading">Buscar y administrar un propietario</h2><p className="text-sm text-slate-600">Selecciona al dueño y administra su ficha, vehículos y acceso desde este mismo lugar. No crees otro registro si ya existe.</p>
   <label className="block space-y-1 text-sm font-semibold">Propietario<select className="input" value={current} onChange={e=>setCurrent(e.target.value)}><option value="">Seleccionar propietario</option>{owners.map(o=><option key={o.id} value={o.id}>{o.name} · {o.document}</option>)}</select></label>
  </div>
  {elegido?<div key={elegido.id} className="space-y-4">
   <div className="card space-y-2"><h3 className="text-lg font-bold">{elegido.name}</h3><p className="text-sm text-slate-600">Documento: {elegido.document} · Contacto: {elegido.contact||"Sin registrar"}</p><p className="text-sm font-semibold">{elegido.vehicles.length} unidades vinculadas · Cuenta: {elegido.users.length?(elegido.users[0].active?"Activa":"Inactiva"):"Sin crear"}</p></div>
   <RecordForm title="Corregir datos del propietario" submit="Guardar cambios" action={actualizarPropietario} fields={[{name:"ownerId",label:"Propietario",type:"hidden",value:elegido.id},{name:"name",uniforme:true,label:"Nombre o razón social",value:elegido.name,required:true},{name:"contact",label:"Contacto (opcional)",required:false,value:elegido.contact??""},{name:"reason",label:"Motivo de la corrección",type:"textarea",required:true}]}/>
   {admin&&<ControlAcceso propietario={elegido} existe={elegido.users.length>0}/>}
   {!admin&&<p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">La creación y recuperación de contraseñas corresponde al Administrador del sistema. Operaciones gestiona las unidades y los datos de la ficha.</p>}
   <div className="card space-y-3"><h3 className="font-bold">Unidades vinculadas</h3>{elegido.vehicles.length?elegido.vehicles.map(v=><div key={v.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-sm"><div><Link href={`/dashboard/ficha-vehicular/${v.id}`} className="font-bold text-kcj-red underline">{v.plate} · {v.code}</Link><p className="text-slate-600">{v.type}</p></div><form action={desvincularUnidadPropietario} className="flex flex-wrap items-center gap-2"><input type="hidden" name="ownerId" value={elegido.id}/><input type="hidden" name="vehicleId" value={v.id}/><input aria-label="Motivo de desvinculación" name="reason" className="input max-w-[220px]" placeholder="Motivo obligatorio" minLength={5} required/><button className="btn-secondary" type="submit">Desvincular</button></form></div>):<p className="text-sm text-slate-600">Todavía no tiene vehículos vinculados.</p>}</div>
   <RecordForm title="Vincular una unidad existente" submit="Vincular unidad" action={vincularUnidadPropietario} fields={[{name:"ownerId",label:"Propietario",type:"hidden",value:elegido.id},{name:"vehicleId",label:"Unidad disponible",type:"select",options:disponibles,required:true},{name:"reason",label:"Motivo o documento que sustenta el vínculo",type:"textarea",required:true}]}/>
  </div>:<p className="rounded-lg border border-kcj-border bg-white p-5 text-sm">Registra o selecciona un propietario para administrar sus unidades y accesos.</p>}
 </section>;
}
