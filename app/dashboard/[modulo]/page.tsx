import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {panelActual} from "@/lib/panel-sesion";
import {rolesParaPanel,panelesDisponibles} from "@/lib/paneles-kcj";
import {requireUser} from "@/lib/auth";
import {rolesActivos} from "@/lib/permisos-kcj";
import {modules,isModuleSlug,canAccess} from "@/lib/modulos";
import {GUIAS_MODULOS} from "@/lib/guia-modulos";
import {ContenidoModulo} from "@/components/dominio/ContenidoModulo";
import {UIIcon,moduleIcon} from "@/components/ui/ModuleIcon";
export default async function ModulePage({params,searchParams}:{params:Promise<{modulo:string}>;searchParams:Promise<{clave?:string;registro?:string}>}){
 const {modulo}=await params;
 const qs=await searchParams;
 if(!isModuleSlug(modulo))notFound();
 const user=await requireUser();
 const panel=await panelActual(user);
 if(!panel)redirect("/seleccionar-panel");
 if(!canAccess(rolesParaPanel(user,panel),modulo))notFound();
 if(panel!=="conductor"&&panelesDisponibles(user).length>1&&modulo==="connect")notFound();
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
  {modulo==="personal"&&["ficha","cuenta"].includes(qs.registro??"")&&<div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-950">{qs.registro==="cuenta"?"Colaborador y cuenta creados en la misma transacción. Ahora puedes verificar su inicio de sesión con las credenciales asignadas.":"Ficha laboral registrada correctamente. Si requiere acceso, ADMIN puede crear la cuenta vinculada desde Centro de Control."}</div>}
  {GUIAS_MODULOS[modulo]&&<details className="rounded-xl border border-kcj-border bg-white px-4 py-3 text-sm shadow-sm"><summary className="cursor-pointer font-semibold text-kcj-charcoal">Guía rápida del proceso · {GUIAS_MODULOS[modulo].responsable}</summary><div className="mt-3 space-y-2 text-slate-700"><p><strong>Secuencia:</strong> {GUIAS_MODULOS[modulo].secuencia}</p><p><strong>Control clave:</strong> {GUIAS_MODULOS[modulo].control}</p></div></details>}
  <ContenidoModulo modulo={modulo} user={panel.startsWith("area:")?{...user,role:rolesParaPanel(user,panel)[0],grants:[]}:panel==="conductor"?{...user,role:"CONDUCTOR",grants:[]}:(user.role==="CONDUCTOR"||user.role==="PROPIETARIO")?{...user,role:rolesParaPanel(user,panel)[0],grants:user.grants.filter(g=>g.role!=="CONDUCTOR"&&g.role!=="PROPIETARIO")}: {...user,grants:user.grants.filter(g=>g.role!=="CONDUCTOR"&&g.role!=="PROPIETARIO")}}/>
 </>;
}
