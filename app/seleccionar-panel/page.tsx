import {redirect} from "next/navigation";
import {requireUser} from "@/lib/auth";
import {panelActual} from "@/lib/panel-sesion";
import {destinoPanel,panelesDisponibles} from "@/lib/paneles-kcj";
import {seleccionarPanel} from "@/app/actions-panel";
import {logout} from "@/app/actions-auth";
import {KcjLogo} from "@/components/ui/KcjLogo";
import {UIIcon} from "@/components/ui/ModuleIcon";

export default async function SeleccionarPanel(){
 const user=await requireUser();
 const disponibles=panelesDisponibles(user);
 if(disponibles.length===1)redirect(destinoPanel(disponibles[0]));
 if(!disponibles.length)redirect("/login");
 const actual=await panelActual(user);
 return <main className="min-h-screen bg-kcj-paper px-4 py-10 sm:py-16">
  <div className="mx-auto max-w-3xl">
   <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
    <KcjLogo size="large"/>
    <form action={logout}><button type="submit" className="btn-secondary text-sm">Cerrar sesión</button></form>
   </header>
   <section className="rounded-3xl border border-kcj-border bg-white p-6 shadow-pane sm:p-10">
    <p className="kcj-eyebrow">KCJ CONTROL EMPRESARIAL</p>
    <h1 className="mt-2 text-2xl font-black text-kcj-charcoal sm:text-3xl">Bienvenido, {user.displayName}</h1>
    <p className="mt-3 text-sm leading-6 text-slate-600">Iniciaste sesión correctamente. Selecciona el panel con el que deseas trabajar. Ambos utilizan tu misma cuenta y contraseña.</p>
    <div className="mt-7 grid gap-4 sm:grid-cols-2">
     <form action={seleccionarPanel}>
      <input type="hidden" name="panel" value="administrativo"/>
      <button type="submit" className="kcj-focus flex h-full min-h-[205px] w-full flex-col items-start rounded-2xl border-2 border-kcj-border bg-white p-6 text-left shadow-pane transition hover:border-kcj-red hover:bg-kcj-redSoft/30">
       <span className="grid h-14 w-14 place-items-center rounded-2xl bg-kcj-redSoft text-kcj-red"><UIIcon name="dashboard" size={29}/></span>
       <span className="mt-5 text-lg font-extrabold text-kcj-charcoal">1. Administrativo</span>
       <span className="mt-1 text-sm text-slate-600">KCJ CONTROL · Gestión según tus permisos</span>
       {actual==="administrativo"&&<span className="mt-3 text-xs font-bold text-kcj-red">Panel actual</span>}
      </button>
     </form>
     <form action={seleccionarPanel}>
      <input type="hidden" name="panel" value="conductor"/>
      <button type="submit" className="kcj-focus flex h-full min-h-[205px] w-full flex-col items-start rounded-2xl border-2 border-kcj-border bg-white p-6 text-left shadow-pane transition hover:border-kcj-red hover:bg-kcj-redSoft/30">
       <span className="grid h-14 w-14 place-items-center rounded-2xl bg-kcj-redSoft text-kcj-red"><UIIcon name="bus" size={29}/></span>
       <span className="mt-5 text-lg font-extrabold text-kcj-charcoal">2. Conductor</span>
       <span className="mt-1 text-sm text-slate-600">KCJ CONNECT · Mis servicios y actividades</span>
       {actual==="conductor"&&<span className="mt-3 text-xs font-bold text-kcj-red">Panel actual</span>}
      </button>
     </form>
    </div>
    <p className="mt-6 text-xs leading-5 text-slate-600">Puedes cambiar de panel sin cerrar sesión. La selección no otorga permisos adicionales.</p>
   </section>
  </div>
 </main>;
}
