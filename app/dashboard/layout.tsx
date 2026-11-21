import Link from "next/link";
import {requireUser} from "@/lib/auth";
import {navigationForRole} from "@/lib/navegacion-kcj";
import {logout} from "@/app/actions-auth";
import {KcjLogo} from "@/components/ui/KcjLogo";
import {NavigationLink} from "@/components/ui/NavigationLink";
import {UIIcon} from "@/components/ui/ModuleIcon";

type Sections = ReturnType<typeof navigationForRole>;
function Navigation({sections}:{sections:Sections}){
 return <nav aria-label="Navegación de procesos KCJ" className="space-y-5">
  <Link href="/dashboard" className="kcj-focus flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
   <UIIcon name="dashboard" size={19}/><span className="flex-1">Panel general</span><UIIcon name="arrow" size={14} className="text-white/40"/>
  </Link>
  {sections.map(section=><section key={section.title} aria-label={section.title}>
   <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.19em] text-slate-400">{section.title}</h2>
   <div className="space-y-0.5">{section.modules.map(m=><NavigationLink key={m.slug} slug={m.slug} label={m.title}/>)}</div>
  </section>)}
 </nav>;
}
function SignOut(){return <form action={logout}><button type="submit" className="kcj-focus flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-kcj-red hover:text-kcj-red"><UIIcon name="logout" size={16}/>Cerrar sesión</button></form>;}
export default async function DashboardLayout({children}:{children:React.ReactNode}){
 const user=await requireUser();
 const sections=navigationForRole(user.role);
 const initials=user.displayName.trim().split(/\s+/).map(w=>w.charAt(0)).slice(0,2).join("").toUpperCase();
 return <div className="min-h-screen lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
  <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto bg-kcj-dark text-white">
   <div className="border-b border-white/10 px-5 pb-6 pt-6">
    <Link href="/dashboard" className="kcj-focus inline-block rounded-xl"><KcjLogo/></Link>
    <p className="mt-4 text-[15px] font-black tracking-[.09em]">KCJ CONTROL</p>
    <p className="mt-1 text-[11px] tracking-wide text-slate-400">PLATAFORMA EMPRESARIAL</p>
   </div>
   <div className="flex-1 px-3 py-5"><Navigation sections={sections}/></div>
   <div className="border-t border-white/10 px-5 py-4">
    <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400"/><p className="text-xs font-medium text-slate-300">Entorno de trabajo KCJ</p></div>
    <p className="mt-2 text-[11px] text-slate-500">Acceso y funciones según permisos</p>
   </div>
  </aside>
  <div className="flex min-w-0 flex-col">
   <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
    <div className="mx-auto flex min-h-[74px] max-w-[1536px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
     <div className="flex min-w-0 items-center gap-3">
      <div className="lg:hidden"><KcjLogo className="max-w-[148px]"/></div>
      <div className="hidden border-l-2 border-kcj-red pl-3 lg:block">
       <p className="text-sm font-bold text-kcj-charcoal">KCJ PERÚ S.A.C.</p>
       <p className="text-xs text-slate-500">Control y gestión empresarial</p>
      </div>
     </div>
     <div className="flex min-w-0 items-center gap-3">
      <div className="hidden min-w-0 text-right sm:block"><p className="truncate text-sm font-semibold text-slate-800">{user.displayName}</p><p className="text-xs text-slate-500">{user.role.replaceAll("_"," ")}</p></div>
      <div title={user.displayName} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-kcj-charcoal text-xs font-bold text-white">{initials||"KC"}</div>
      <div className="hidden sm:block"><SignOut/></div>
      <details className="relative lg:hidden">
       <summary className="kcj-focus flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 text-kcj-charcoal [&::-webkit-details-marker]:hidden" aria-label="Abrir menú"><UIIcon name="menu"/></summary>
       <div className="absolute right-0 top-12 max-h-[75vh] w-[min(88vw,340px)] overflow-y-auto rounded-2xl border border-slate-200 bg-kcj-dark p-3 text-white shadow-xl">
        <Navigation sections={sections}/>
        <form action={logout} className="mt-4 border-t border-white/10 pt-3"><button type="submit" className="w-full rounded-lg bg-white/10 p-2 text-sm font-medium">Cerrar sesión</button></form>
       </div>
      </details>
     </div>
    </div>
   </header>
   <main id="contenido" className="mx-auto w-full max-w-[1536px] flex-1 space-y-6 px-4 pb-10 pt-7 sm:px-6 lg:px-8">{children}</main>
   <footer className="border-t border-slate-200/80 bg-white/70 px-4 py-3 text-center text-xs text-slate-500">KCJ CONTROL · Uso interno autorizado · KCJ PERÚ S.A.C.</footer>
  </div>
 </div>;
}
