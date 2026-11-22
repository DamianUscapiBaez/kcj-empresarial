"use client";
import {useEffect,useId,useState} from "react";
import {usePathname} from "next/navigation";
import {NavigationLink} from "@/components/ui/NavigationLink";
import {PausasNavigationLink} from "@/components/ui/PausasNavigationLink";
import {UIIcon} from "@/components/ui/ModuleIcon";
import type {ModuleSlug} from "@/lib/modulos";

type NavigationModule={slug:ModuleSlug;title:string};
type Props={title:string;modules:readonly NavigationModule[];showPausas:boolean;initiallyOpen?:boolean};

/** Grupo desplegable accesible; abrir la sección activa no modifica permisos ni rutas. */
export function NavigationGroup({title,modules,showPausas,initiallyOpen=false}:Props){
 const path=usePathname();
 const active=modules.some(m=>path===`/dashboard/${m.slug}`)||(showPausas&&path.startsWith("/dashboard/pausas-activas"));
 const [open,setOpen]=useState(initiallyOpen||active);
 const regionId=useId();
 useEffect(()=>{if(active)setOpen(true);},[active,path]);
 const count=modules.length+(showPausas?1:0);
 return <section aria-label={title} className="space-y-1">
  <h2>
   <button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-controls={regionId}
    className="kcj-focus flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-[.075em] text-[#33404A] transition hover:bg-white/90 hover:text-kcj-red">
    <span className="min-w-0 flex-1 leading-4">{title}</span>
    <span className="rounded-md border border-[#C9D1D8] bg-white/80 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[#45535E]" aria-label={`${count} accesos`}>{count}</span>
    <UIIcon name="arrow" size={13} className={`shrink-0 text-[#45535E] transition-transform ${open?"rotate-90":""}`}/>
   </button>
  </h2>
  <div id={regionId} className={open?"space-y-0.5 pb-2":"hidden"}>
   {modules.map(m=><NavigationLink key={m.slug} slug={m.slug} label={m.title}/>)}
   {showPausas&&<PausasNavigationLink/>}
  </div>
 </section>;
}
