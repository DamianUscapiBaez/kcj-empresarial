"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {UIIcon} from "@/components/ui/ModuleIcon";
export function PausasNavigationLink(){
 const active=usePathname().startsWith("/dashboard/pausas-activas");
 return <Link href="/dashboard/pausas-activas" aria-current={active?"page":undefined} className={`kcj-focus flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${active?"border-[#E6C7CE] bg-kcj-redSoft text-kcj-red":"border-transparent text-kcj-charcoal hover:bg-white/80"}`}><UIIcon name="clock" size={18}/>Pausas Activas</Link>;
}
