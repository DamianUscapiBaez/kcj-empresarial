"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
type Unit={id:string;code:string;plate:string;type:string};
/** Navegación local, no modifica unidades ni cambia la sesión. */
export function SelectorUnidad({units,actual}:{units:Unit[];actual?:string}){
 const [term,setTerm]=useState("");
 const filtered=useMemo(()=>units.filter(u=>`${u.code} ${u.plate} ${u.type}`.toLocaleLowerCase("es-PE").includes(term.toLocaleLowerCase("es-PE"))).slice(0,40),[term,units]);
 return <section className="card space-y-3"><h2 className="kcj-card-heading">Buscar y cambiar de unidad</h2>
  <label className="block space-y-1 text-sm font-medium">Placa, código KCJ o tipo
   <input className="input" value={term} onChange={e=>setTerm(e.target.value)} placeholder="Buscar una unidad registrada" />
  </label><p className="text-xs text-slate-600">{filtered.length} unidad(es) mostrada(s) de {units.length}. Cada vehículo conserva su expediente individual.</p>
  <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
   {filtered.map(u=><Link key={u.id} href={`/dashboard/ficha-vehicular/${encodeURIComponent(u.id)}`} aria-current={u.id===actual?"page":undefined} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${u.id===actual?"border-kcj-red bg-kcj-redSoft text-kcj-red":"border-kcj-border bg-white text-kcj-charcoal hover:border-kcj-red"}`}>{u.code} · {u.plate}</Link>)}
   {!filtered.length&&<p role="status" className="text-sm text-amber-800">No se encontró una unidad con esos datos.</p>}
  </div>
 </section>;
}
