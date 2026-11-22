"use client";
import {useEffect,useState,type ReactNode} from "react";
import {usePathname} from "next/navigation";
import {UIIcon} from "@/components/ui/ModuleIcon";

/** Oculta el menú móvil al navegar y evita que cubra la pantalla siguiente. */
export function MobileNavigation({children}:{children:ReactNode}){
 const path=usePathname();
 const [open,setOpen]=useState(false);
 useEffect(()=>setOpen(false),[path]);
 return <div className="relative lg:hidden">
  <button type="button" aria-label={open?"Cerrar menú de navegación":"Abrir menú de navegación"}
   aria-expanded={open} aria-controls="kcj-menu-movil" onClick={()=>setOpen(value=>!value)}
   className="kcj-focus flex h-10 w-10 items-center justify-center rounded-xl border border-kcj-border text-kcj-charcoal">
   <UIIcon name="menu"/>
  </button>
  {open&&<div id="kcj-menu-movil" className="absolute right-0 top-12 z-50 max-h-[75vh] w-[min(88vw,340px)] overflow-y-auto rounded-2xl border border-kcj-border bg-kcj-sidebar p-3 text-kcj-charcoal shadow-xl">
   {children}
  </div>}
 </div>;
}
