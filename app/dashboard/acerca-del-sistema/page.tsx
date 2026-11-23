import {requireUser} from "@/lib/auth";
import {CREDITOS_PROYECTO} from "@/lib/creditos-proyecto";

export const metadata = {title:"Acerca del sistema | KCJ CONTROL Empresarial"};

export default async function AcercaDelSistema(){
 await requireUser();
 return <div className="mx-auto max-w-3xl space-y-6">
  <header className="rounded-3xl bg-kcj-charcoal p-6 text-white sm:p-8">
   <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Información del proyecto</p>
   <h1 className="mt-2 text-2xl font-black sm:text-3xl">Acerca del sistema</h1>
   <p className="mt-2 text-sm text-slate-200">Identidad institucional y reconocimiento de creación de KCJ CONTROL.</p>
  </header>
  <section aria-label="Créditos del sistema" className="rounded-2xl border border-kcj-border bg-white p-6 shadow-pane sm:p-8">
   <p className="text-xs font-bold uppercase tracking-widest text-kcj-red">{CREDITOS_PROYECTO.sistema}</p>
   <h2 className="mt-2 text-xl font-bold text-kcj-charcoal">Sistema de Gestión Empresarial</h2>
   <p className="mt-1 text-sm text-slate-600">{CREDITOS_PROYECTO.empresa}</p>
   <div className="my-6 h-px bg-slate-200"/>
   <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{CREDITOS_PROYECTO.concepto}</p>
   <p data-testid="creador-del-sistema" className="mt-2 text-xl font-black tracking-wide text-kcj-charcoal sm:text-2xl">{CREDITOS_PROYECTO.creador}</p>
   <p className="mt-4 text-sm leading-6 text-slate-600">Reconocimiento institucional del creador de KCJ CONTROL Empresarial, desarrollado para KCJ PERÚ S.A.C.</p>
  </section>
  <p className="text-xs text-slate-500">Estos créditos son de solo lectura y no pueden modificarse desde los paneles de la aplicación.</p>
 </div>;
}
