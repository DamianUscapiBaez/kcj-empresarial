"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import type {ModuleSlug} from "@/lib/modulos";
import {UIIcon,moduleIcon} from "@/components/ui/ModuleIcon";

export function NavigationLink({slug,label}:{slug:ModuleSlug;label:string}){
 const current=usePathname();
 const active=current===`/dashboard/${slug}`;
 return <Link href={`/dashboard/${slug}`} aria-current={active?"page":undefined}
  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${active?"bg-white/[0.12] text-white ring-1 ring-white/10":"text-slate-300 hover:bg-white/10 hover:text-white"}`}>
   <span className={`${active?"bg-kcj-red text-white":"bg-white/5 text-slate-400 group-hover:text-white"} grid h-8 w-8 shrink-0 place-items-center rounded-lg`}><UIIcon name={moduleIcon[slug]} size={17}/></span>
   <span className="min-w-0 flex-1 truncate">{label}</span>
   {active&&<span className="h-1.5 w-1.5 rounded-full bg-rose-400"/>}
  </Link>;
}
