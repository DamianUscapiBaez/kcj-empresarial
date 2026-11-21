import Image from "next/image";
import Link from "next/link";
import {requireUser} from "@/lib/auth";
import {navigationForRole} from "@/lib/navegacion-kcj";
import {logout} from "@/app/actions-auth";
export default async function DashboardLayout({children}:{children:React.ReactNode}){
 const u=await requireUser();
 const sections=navigationForRole(u.role);
 return <div className="min-h-screen lg:flex">
  <aside className="bg-navy text-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:shrink-0 lg:overflow-y-auto">
   <Link href="/dashboard" className="flex items-center gap-3 border-b border-white/10 p-4">
    <Image src="/assets/kcj-logo-original.jpg" width={44} height={44} className="h-11 w-11 rounded-lg object-cover" alt="Logo KCJ" />
    <span className="font-black tracking-tight">KCJ CONTROL <small className="block font-normal text-slate-300">EMPRESARIAL</small></span>
   </Link>
   <nav aria-label="Procesos KCJ" className="space-y-3 px-3 py-3">
    {sections.map(section=><section key={section.title} aria-label={section.title}>
     <h2 className="px-3 pb-1 text-xs font-bold uppercase tracking-wider text-slate-300">{section.title}</h2>
     <div className="flex flex-wrap gap-1 lg:block lg:space-y-0.5">{section.modules.map(m=><Link key={m.slug} href={`/dashboard/${m.slug}`} className="block rounded-lg px-3 py-2 text-sm text-slate-100 hover:bg-white/10 hover:text-white">{m.title}</Link>)}</div>
    </section>)}
   </nav>
  </aside>
  <div className="min-w-0 flex-1">
   <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white p-4">
    <div><p className="text-sm font-semibold text-navy">{u.displayName}</p><p className="text-xs text-slate-500">{u.role.replaceAll("_"," ")}</p></div>
    <form action={logout}><button className="btn-secondary">Cerrar sesión</button></form>
   </header>
   <main className="mx-auto max-w-7xl space-y-5 p-5">{children}</main>
  </div>
 </div>;
}
