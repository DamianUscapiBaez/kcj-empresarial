"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import type {ModuleSlug} from "@/lib/modulos";
import {UIIcon,moduleIcon} from "@/components/ui/ModuleIcon";

export function NavigationLink({slug,label}:{slug:ModuleSlug;label:string}){
 const current=usePathname();
 const active=current===`/dashboard/${slug}`;
 return <Link href={`/dashboard/${slug}`} aria-current={active?"page":undefined}
  className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kcj-red ${active?"border-[#E6C7CE] bg-kcj-redSoft text-[#822334]":"border-transparent text-[#33404A] hover:border-kcj-border hover:bg-white/90 hover:text-kcj-charcoal"}`}>
   <span className={`${active?"bg-[#F0D7DD] text-[#822334]":"bg-white/65 text-[#4D5D69] group-hover:bg-white group-hover:text-kcj-red"} grid h-8 w-8 shrink-0 place-items-center rounded-lg`}><UIIcon name={moduleIcon[slug]} size={17}/></span>
   <span className="min-w-0 flex-1 truncate">{label}</span>
   {active&&<span className="h-1.5 w-1.5 rounded-full bg-kcj-red"/>}
  </Link>;
}
