import Link from "next/link";
import {notFound} from "next/navigation";
import {requireUser} from "@/lib/auth";
import {modules,isModuleSlug,canAccess} from "@/lib/modulos";
import {ContenidoModulo} from "@/components/dominio/ContenidoModulo";
import {UIIcon,moduleIcon} from "@/components/ui/ModuleIcon";
export default async function ModulePage({params}:{params:Promise<{modulo:string}>}){
 const {modulo}=await params;
 if(!isModuleSlug(modulo))notFound();
 const user=await requireUser();
 if(!canAccess(user.role,modulo))notFound();
 const meta=modules.find(m=>m.slug===modulo)!;
 return <>
  <div className="flex items-center gap-2 text-xs text-slate-500"><Link href="/dashboard" className="font-medium hover:text-kcj-red">Inicio</Link><span>/</span><span className="font-semibold text-kcj-charcoal">{meta.title}</span></div>
  <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-pane sm:p-6">
   <span className="absolute inset-y-0 left-0 w-1.5 bg-kcj-red"/>
   <div className="flex items-center gap-4">
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-red-50 text-kcj-red"><UIIcon name={moduleIcon[modulo]} size={28}/></span>
    <div><p className="kcj-eyebrow">KCJ CONTROL · Módulo operativo</p><h1 className="mt-1 text-2xl font-black tracking-tight text-kcj-charcoal sm:text-3xl">{meta.title}</h1><p className="mt-1 text-sm text-slate-500">{meta.description} · Registros centralizados en PostgreSQL</p></div>
   </div>
  </header>
  <ContenidoModulo modulo={modulo} user={user}/>
 </>;
}
