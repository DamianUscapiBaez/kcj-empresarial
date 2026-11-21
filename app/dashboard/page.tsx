import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {modules,canAccess,type ModuleSlug} from "@/lib/modulos";
import {navigationForRole} from "@/lib/navegacion-kcj";
import {requireUser} from "@/lib/auth";
import {UIIcon,moduleIcon} from "@/components/ui/ModuleIcon";

const highlights:Record<ModuleSlug,string>={
 acceso:"Perfiles y seguridad",personal:"Ficha laboral única",operaciones:"Servicios y movimientos",roster:"Programación de guardias",connect:"Mis actividades",flota:"Control de unidades",mantenimiento:"Órdenes y liberaciones",ssoma:"Hallazgos y prevención",homologacion:"Habilitaciones externas",tareo:"Horas efectivas",aula:"Formación y evaluaciones",rrhh:"Gestión laboral",salud:"Aptitud operacional",propietarios:"Mis unidades",comunicaciones:"Avisos y confirmaciones",reportes:"Indicadores e informes",custodia:"Actas y devoluciones",almacen:"Inventario compartido",
};
export default async function Dashboard(){
 const user=await requireUser();
 const [workers,vehicles,services,openCases,courses]=await Promise.all([
  prisma.worker.count(),prisma.vehicle.count(),prisma.service.count(),
  prisma.safetyCase.count({where:{status:{not:"CERRADO"}}}),
  prisma.course.count({where:{published:true}}),
 ]);
 const counts=[
  {n:workers,l:"Personal registrado",hint:"Fichas de trabajadores",icon:"users" as const},
  {n:vehicles,l:"Unidades registradas",hint:"Padrón de vehículos",icon:"bus" as const},
  {n:services,l:"Servicios",hint:"Programados e históricos",icon:"truck" as const},
  {n:openCases,l:"Casos SSOMA abiertos",hint:"Requieren seguimiento",icon:"shield" as const},
  {n:courses,l:"Cursos publicados",hint:"Aula Virtual",icon:"book" as const},
 ];
 const sections=navigationForRole(user.role);
 const showStats=!["CONDUCTOR","PROPIETARIO","SALUD"].includes(user.role);
 const date=new Intl.DateTimeFormat("es-PE",{timeZone:"America/Lima",weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date());
 const favorite:ModuleSlug[]=["operaciones","roster","tareo","flota","ssoma","aula"];
 const shortcuts=favorite.filter(slug=>canAccess(user.role,slug));
 return <>
  <section className="relative overflow-hidden rounded-3xl bg-kcj-charcoal p-6 text-white shadow-soft sm:p-8">
   <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border-[42px] border-white/[.035]"/>
   <div className="pointer-events-none absolute bottom-0 right-0 h-2 w-full bg-gradient-to-r from-kcj-red to-[#D24B5C]"/>
   <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
    <div>
     <p className="text-xs font-bold uppercase tracking-[.2em] text-rose-300">Panel de control</p>
     <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Bienvenido a KCJ CONTROL</h1>
     <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Gestión integrada de KCJ PERÚ S.A.C. Consulta información y accede a los procesos autorizados para tu cargo.</p>
    </div>
    <div className="shrink-0 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs text-slate-200"><span className="block text-[10px] uppercase tracking-widest text-slate-400">Fecha de consulta</span><span className="mt-1 block font-semibold capitalize">{date}</span></div>
   </div>
  </section>
  {showStats&&<section aria-label="Indicadores generales" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
   {counts.map((item,i)=><article key={item.l} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-pane transition hover:-translate-y-0.5 hover:border-slate-300">
    <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-kcj-charcoal group-hover:bg-red-50 group-hover:text-kcj-red"><UIIcon name={item.icon} size={20}/></span><span className={`h-1.5 w-7 rounded-full ${i===3?"bg-kcj-red":"bg-slate-300"}`}/></div>
    <p className="mt-4 text-3xl font-black tabular-nums tracking-tight text-kcj-charcoal">{item.n.toLocaleString("es-PE")}</p>
    <h2 className="mt-1 text-sm font-semibold text-slate-800">{item.l}</h2>
    <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
   </article>)}
  </section>}
  {shortcuts.length>0&&<section className="space-y-3">
   <div><p className="kcj-eyebrow">Accesos directos</p><h2 className="mt-1 text-xl font-bold text-kcj-charcoal">Procesos de uso frecuente</h2></div>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    {shortcuts.map(slug=>{const meta=modules.find(m=>m.slug===slug)!;return <Link key={slug} href={`/dashboard/${slug}`} className="kcj-focus group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-pane transition hover:border-kcj-red/40 hover:bg-red-50/40">
     <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-kcj-red"><UIIcon name={moduleIcon[slug]} size={21}/></span><span className="min-w-0 flex-1 text-xs font-bold text-slate-800">{meta.title}</span><UIIcon name="arrow" size={14} className="text-slate-400 group-hover:text-kcj-red"/>
    </Link>})}
   </div>
  </section>}
  <section className="space-y-4">
   <div><p className="kcj-eyebrow">Áreas y herramientas</p><h2 className="mt-1 text-xl font-bold text-kcj-charcoal">Mis funciones disponibles</h2><p className="kcj-muted">Los accesos dependen de los permisos asignados. Los módulos comparten los registros autorizados de KCJ.</p></div>
   {sections.map(section=><div key={section.title} className="space-y-3">
    <div className="flex items-center gap-3"><h3 className="text-sm font-bold text-kcj-charcoal">{section.title}</h3><div className="h-px flex-1 bg-slate-200"/><span className="text-xs text-slate-400">{section.modules.length}</span></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
     {section.modules.map(m=><Link href={`/dashboard/${m.slug}`} key={m.slug} className="kcj-focus group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-pane transition hover:-translate-y-0.5 hover:border-kcj-red/40">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-kcj-charcoal transition group-hover:bg-red-50 group-hover:text-kcj-red"><UIIcon name={moduleIcon[m.slug]} size={23}/></div>
      <div className="min-w-0 flex-1"><h4 className="font-bold text-kcj-charcoal">{m.title}</h4><p className="mt-1 text-xs leading-5 text-slate-500">{highlights[m.slug]}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-kcj-red">Abrir proceso <UIIcon name="arrow" size={13}/></span></div>
     </Link>)}
    </div>
   </div>)}
  </section>
 </>;
}
