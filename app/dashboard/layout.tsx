import {rolesActivos} from "@/lib/permisos-kcj";
import {panelActual} from "@/lib/panel-sesion";
import {panelesDisponibles,rolesParaPanel,nombrePanel} from "@/lib/paneles-kcj";
import {redirect} from "next/navigation";
import Link from "next/link";
import {requireUser} from "@/lib/auth";
import {navigationForRole} from "@/lib/navegacion-kcj";
import {logout} from "@/app/actions-auth";
import {KcjLogo} from "@/components/ui/KcjLogo";
import {NavigationGroup} from "@/components/ui/NavigationGroup";
import {MobileNavigation} from "@/components/ui/MobileNavigation";
import {UIIcon} from "@/components/ui/ModuleIcon";

type Sections = ReturnType<typeof navigationForRole>;
function Navigation({sections}:{sections:Sections}){
 return <nav aria-label="Navegación de procesos KCJ" className="space-y-2">
  <Link href="/dashboard" className="kcj-focus flex items-center gap-3 rounded-xl border border-kcj-border bg-white/70 px-3 py-3 text-sm font-semibold text-kcj-charcoal transition hover:bg-white/90">
   <UIIcon name="dashboard" size={19}/><span className="flex-1">Panel general</span><UIIcon name="arrow" size={14} className="text-kcj-muted"/>
  </Link>
  {sections.map((section,index)=><NavigationGroup key={section.title} title={section.title}
   modules={section.modules} showPausas={section.showPausas} initiallyOpen={index===0}/>)}
 </nav>;
}
function SignOut(){return <form action={logout}><button type="submit" className="kcj-focus flex items-center gap-2 rounded-xl border border-kcj-border px-3.5 py-2 text-xs font-semibold text-kcj-charcoal transition hover:border-kcj-red hover:text-kcj-red"><UIIcon name="logout" size={16}/>Cerrar sesión</button></form>;}
export default async function DashboardLayout({children}:{children:React.ReactNode}){
 const user=await requireUser();
 if(user.role==="PROPIETARIO"&&user.mustChangePassword)redirect("/cambiar-clave");
 const panel=await panelActual(user);
 if(!panel)redirect("/seleccionar-panel");
 const dual=panelesDisponibles(user).length>1;
 const baseSections=navigationForRole(rolesParaPanel(user,panel));
 const sections=(panel==="conductor"?navigationForRole(["CONDUCTOR"]):baseSections)
  .map(s=>({...s,modules:panel!=="conductor"&&dual?s.modules.filter(m=>m.slug!=="connect"):s.modules}))
  .filter(s=>s.modules.length>0||s.showPausas);
 const initials=user.displayName.trim().split(/\s+/).map(w=>w.charAt(0)).slice(0,2).join("").toUpperCase();
 return <div className="min-h-screen lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
  <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto border-r border-kcj-border bg-kcj-sidebar text-kcj-charcoal">
   <div className="border-b border-kcj-border px-5 pb-6 pt-6">
    <Link href="/dashboard" className="kcj-focus inline-block rounded-xl"><KcjLogo/></Link>
    <p className="mt-4 text-[15px] font-black tracking-[.09em] text-kcj-charcoal">KCJ CONTROL</p>
    <p className="mt-1 text-[11px] tracking-wide text-[#596774]">{panel==="conductor"?"PANEL CONDUCTOR · KCJ CONNECT":`PANEL ${nombrePanel(panel).toUpperCase()}`}</p>
   </div>
   <div className="flex-1 px-3 py-5"><Navigation sections={sections}/>{dual&&<Link href="/seleccionar-panel" className="kcj-focus mt-5 flex items-center justify-center rounded-xl border border-kcj-border bg-white px-4 py-3 text-sm font-bold text-kcj-charcoal hover:border-kcj-red">Cambiar de área / panel</Link>}</div>
   <div className="border-t border-kcj-border px-5 py-4">
    <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-700"/><p className="text-xs font-medium text-[#46545F]">Entorno de trabajo KCJ</p></div>
    <p className="mt-2 text-[11px] text-[#596774]">Acceso y funciones según permisos</p>
    <Link href="/dashboard/acerca-del-sistema" className="kcj-focus mt-3 inline-block text-xs font-semibold text-kcj-charcoal underline decoration-kcj-red/40 underline-offset-4 hover:text-kcj-red">Acerca del sistema</Link>
   </div>
  </aside>
  <div className="flex min-w-0 flex-col">
   <header className="sticky top-0 z-30 border-b border-kcj-border bg-white/95 backdrop-blur-xl">
    <div className="mx-auto flex min-h-[74px] max-w-[1536px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
     <div className="flex min-w-0 items-center gap-3">
      <div className="lg:hidden"><KcjLogo className="max-w-[148px]"/></div>
      <div className="hidden border-l-2 border-kcj-red pl-3 lg:block">
       <p className="text-sm font-bold text-kcj-charcoal">KCJ PERÚ S.A.C.</p>
       <p className="text-xs text-slate-500">Control y gestión empresarial</p>
      </div>
     </div>
     <div className="flex min-w-0 items-center gap-3">
      <div className="hidden min-w-0 text-right sm:block"><p className="truncate text-sm font-semibold text-slate-800">{user.role==="ADMIN"?"Centro de Control":user.displayName}</p><p className="text-xs text-[#56636F]">{panel==="conductor"?"Panel Conductor · KCJ CONNECT":panel.startsWith("area:")?`Panel de ${nombrePanel(panel)}`:user.role==="ADMIN"?`Administración principal · ${user.displayName}`:user.role.replaceAll("_"," ")}</p></div>
      <div title={user.displayName} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-kcj-charcoal text-xs font-bold text-white">{initials||"KC"}</div>
      {dual&&<Link href="/seleccionar-panel" className="kcj-focus hidden rounded-lg border border-kcj-border px-3 py-2 text-xs font-semibold text-kcj-charcoal hover:bg-kcj-redSoft sm:inline-flex">Cambiar área</Link>}
      <Link href="/cambiar-clave" className="kcj-focus hidden rounded-lg border border-kcj-border px-3 py-2 text-xs font-semibold text-kcj-charcoal hover:bg-kcj-redSoft sm:inline-flex">Cambiar mi contraseña</Link><div className="hidden sm:block"><SignOut/></div>
      <MobileNavigation>
       <Navigation sections={sections}/>
       {dual&&<Link href="/seleccionar-panel" className="mt-4 block rounded-lg border border-kcj-border bg-white p-2 text-sm font-semibold text-kcj-charcoal">Cambiar de área / panel</Link>}
       <Link href="/cambiar-clave" className="mt-4 block rounded-lg border border-kcj-border bg-white p-2 text-sm font-medium text-kcj-charcoal">Cambiar mi contraseña</Link>
       <Link href="/dashboard/acerca-del-sistema" className="mt-4 block rounded-lg border border-kcj-border bg-white p-2 text-sm font-medium text-kcj-charcoal">Acerca del sistema</Link>
       <form action={logout} className="mt-4 border-t border-kcj-border pt-3"><button type="submit" className="w-full rounded-lg bg-white p-2 text-sm font-medium text-kcj-charcoal">Cerrar sesión</button></form>
      </MobileNavigation>
     </div>
    </div>
   </header>
   <main id="contenido" className="mx-auto w-full max-w-[1536px] flex-1 space-y-6 px-4 pb-10 pt-7 sm:px-6 lg:px-8">{children}</main>
   <footer className="border-t border-kcj-border bg-white/70 px-4 py-3 text-center text-xs text-slate-500">KCJ CONTROL · Uso interno autorizado · KCJ PERÚ S.A.C. · <Link href="/dashboard/acerca-del-sistema" className="font-semibold underline underline-offset-2 hover:text-kcj-red">Acerca del sistema</Link></footer>
  </div>
 </div>;
}
