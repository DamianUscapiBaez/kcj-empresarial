import Link from "next/link";
import {notFound} from "next/navigation";
import {requireUser} from "@/lib/auth";
import {rolesActivos} from "@/lib/permisos-kcj";
import {modules,isModuleSlug,canAccess} from "@/lib/modulos";
import {ContenidoModulo} from "@/components/dominio/ContenidoModulo";
import {UIIcon,moduleIcon} from "@/components/ui/ModuleIcon";
export default async function ModulePage({params,searchParams}:{params:Promise<{modulo:string}>;searchParams:Promise<{clave?:string}>}){
 const {modulo}=await params;
 const qs=await searchParams;
 if(!isModuleSlug(modulo))notFound();
 const user=await requireUser();
 if(!canAccess(rolesActivos(user),modulo))notFound();
 const meta=modules.find(m=>m.slug===modulo)!;
 return <>
  <div className="flex items-center gap-2 text-xs text-kcj-muted"><Link href="/dashboard" className="font-medium hover:text-kcj-red">Inicio</Link><span>/</span><span className="font-semibold text-kcj-charcoal">{meta.title}</span></div>
  <header className="relative overflow-hidden rounded-2xl border border-kcj-border bg-white p-5 shadow-pane sm:p-6">
   <span className="absolute inset-y-0 left-0 w-1.5 bg-kcj-red"/>
   <div className="flex items-center gap-4">
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-kcj-redSoft text-kcj-red"><UIIcon name={moduleIcon[modulo]} size={28}/></span>
    <div><p className="kcj-eyebrow">KCJ CONTROL · Módulo operativo</p><h1 className="mt-1 text-2xl font-black tracking-tight text-kcj-charcoal sm:text-3xl">{meta.title}</h1><p className="mt-1 text-sm text-kcj-muted">{meta.description} · Información de KCJ PERÚ S.A.C.</p></div>
   </div>
  </header>
  {modulo==="acceso"&&qs.clave==="actualizada"&&<div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-950">Contraseña actualizada. Las sesiones anteriores del colaborador se cerraron; debe ingresar nuevamente con la nueva contraseña.</div>}
  <ContenidoModulo modulo={modulo} user={user}/>
 </>;
}
