import {rolesActivos,tieneRol} from "@/lib/permisos-kcj";
import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {modules,canAccess,type ModuleSlug} from "@/lib/modulos";
import {navigationForRole,labelsNavegacion} from "@/lib/navegacion-kcj";
import {requireUser} from "@/lib/auth";
import {UIIcon,moduleIcon} from "@/components/ui/ModuleIcon";

const highlights:Record<ModuleSlug,string>={
 acceso:"Perfiles y seguridad",personal:"Áreas de trabajo y ficha única",operaciones:"Servicios y movimientos",roster:"Programación de guardias",connect:"Mis actividades",flota:"Control de unidades",mantenimiento:"Órdenes y liberaciones",ssoma:"Hallazgos y prevención",homologacion:"Habilitaciones externas",tareo:"Horas efectivas",aula:"Formación y evaluaciones",rrhh:"Gestión laboral",salud:"Aptitud operacional",propietarios:"Mis unidades",comunicaciones:"Avisos y confirmaciones",reportes:"Indicadores e informes",custodia:"Actas y devoluciones",almacen:"Inventario compartido",
};
export default async function Dashboard(){
 const user=await requireUser();
 // El menú siempre debe renderizar aunque falle un indicador secundario.
 // Un error de PostgreSQL no debe presentarse como si hubiera cero registros.
 const showStats=!["CONDUCTOR","PROPIETARIO","SALUD"].includes(user.role);
 const results=showStats?await Promise.allSettled([
  prisma.worker.count(),prisma.vehicle.count(),prisma.service.count(),
  prisma.safetyCase.count({where:{status:{not:"CERRADO"}}}),
  prisma.course.count({where:{published:true}}),
 ]):[];
 const metric=(index:number):number|null=>{
  const result=results[index];
  return result?.status==="fulfilled"?result.value:null;
 };
 const counts=[
  {n:metric(0),l:"Colaboradores registrados",hint:"Fichas laborales únicas",icon:"users" as const},
  {n:metric(1),l:"Unidades registradas",hint:"Padrón de vehículos",icon:"bus" as const},
  {n:metric(2),l:"Servicios",hint:"Programados e históricos",icon:"truck" as const},
  {n:metric(3),l:"Casos SSOMA abiertos",hint:"Requieren seguimiento",icon:"shield" as const},
  {n:metric(4),l:"Cursos publicados",hint:"Aula Virtual",icon:"book" as const},
 ];
 const failedMetrics=results.filter(result=>result.status==="rejected").length;
 if(failedMetrics>0)console.error(`[KCJ] Fallaron ${failedMetrics} indicadores del dashboard. Verificar migraciones y conexión de PostgreSQL.`);
 const sections=navigationForRole(rolesActivos(user));
 const date=new Intl.DateTimeFormat("es-PE",{timeZone:"America/Lima",weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date());
 const favorite:ModuleSlug[]=["operaciones","roster","tareo","flota","ssoma","aula"];
 const shortcuts=favorite.filter(slug=>canAccess(rolesActivos(user),slug));
 return <>
  <section className="relative overflow-hidden rounded-3xl bg-kcj-charcoal p-6 text-white shadow-soft sm:p-8">
   <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border-[42px] border-white/[.035]"/>
   <div className="pointer-events-none absolute bottom-0 right-0 h-2 w-full bg-gradient-to-r from-kcj-redDark to-kcj-red"/>
   <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
    <div>
     <p className="text-xs font-bold uppercase tracking-[.2em] text-[#F8D7DE]">Panel de control</p>
     <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Bienvenido a KCJ CONTROL</h1>
     <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Gestión integrada de KCJ PERÚ S.A.C. Consulta información y accede a los procesos autorizados para tus funciones autorizadas.</p>
    </div>
    <div className="shrink-0 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs text-slate-200"><span className="block text-[10px] uppercase tracking-widest text-slate-400">Fecha de consulta</span><span className="mt-1 block font-semibold capitalize">{date}</span></div>
   </div>
  </section>
  {showStats&&failedMetrics>0&&<section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900"><p className="font-bold">Algunos indicadores no pudieron cargarse.</p><p className="mt-1">La navegación permanece disponible. Esto no significa que los registros estén vacíos: TI debe revisar la conexión, las migraciones y los registros del servidor.</p></section>}
  {showStats&&<section aria-label="Indicadores generales" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
   {counts.map((item,i)=><article key={item.l} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-pane transition hover:-translate-y-0.5 hover:border-slate-300">
    <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-kcj-charcoal group-hover:bg-kcj-redSoft group-hover:text-kcj-red"><UIIcon name={item.icon} size={20}/></span><span className={`h-1.5 w-7 rounded-full ${i===3?"bg-kcj-red":"bg-slate-300"}`}/></div>
    <p className="mt-4 text-3xl font-black tabular-nums tracking-tight text-kcj-charcoal">{item.n===null?"—":item.n.toLocaleString("es-PE")}</p>
    <h2 className="mt-1 text-sm font-semibold text-slate-800">{item.l}</h2>
    <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
   </article>)}
  </section>}
  {tieneRol(user,"ADMIN","GERENCIA","OPERACIONES","JEFE_OPERACIONES","SSOMA","SALUD")&&<Link href="/dashboard/pausas-activas" className="kcj-focus flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E6C7CE] bg-white p-5 shadow-pane transition hover:bg-kcj-redSoft/30"><div><p className="kcj-eyebrow">Servicios y jornadas</p><p className="mt-1 font-bold text-kcj-charcoal">Control Maestro de Pausas Activas</p><p className="text-xs text-slate-600">Consultar todos los conductores por fecha y descargar el PDF vertical.</p></div><span className="rounded-lg border border-kcj-border px-3 py-2 text-sm font-semibold text-kcj-charcoal">Abrir control</span></Link>}
  {shortcuts.length>0&&<section className="space-y-3">
   <div><p className="kcj-eyebrow">Accesos directos</p><h2 className="mt-1 text-xl font-bold text-kcj-charcoal">Procesos de uso frecuente</h2></div>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    {shortcuts.map(slug=>{const meta=modules.find(m=>m.slug===slug)!;return <Link key={slug} href={`/dashboard/${slug}`} className="kcj-focus group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-pane transition hover:border-[#E6C7CE] hover:bg-kcj-redSoft/50">
     <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-kcj-redSoft text-kcj-red"><UIIcon name={moduleIcon[slug]} size={21}/></span><span className="min-w-0 flex-1 text-xs font-bold text-slate-800">{labelsNavegacion[slug]??meta.title}</span><UIIcon name="arrow" size={14} className="text-slate-400 group-hover:text-kcj-red"/>
    </Link>})}
   </div>
  </section>}
  <section className="space-y-4">
   <div><p className="kcj-eyebrow">Áreas y herramientas</p><h2 className="mt-1 text-xl font-bold text-kcj-charcoal">Mis funciones disponibles</h2><p className="kcj-muted">Los accesos dependen de los permisos asignados. Los módulos comparten los registros autorizados de KCJ.</p></div>
   {sections.map(section=><div key={section.title} className="space-y-3">
    <div className="flex items-center gap-3"><h3 className="text-sm font-bold text-kcj-charcoal">{section.title}</h3><div className="h-px flex-1 bg-slate-200"/><span className="text-xs text-slate-400">{section.modules.length}</span></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
     {section.modules.map(m=><Link href={`/dashboard/${m.slug}`} key={m.slug} className="kcj-focus group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-pane transition hover:-translate-y-0.5 hover:border-[#E6C7CE]">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-kcj-charcoal transition group-hover:bg-kcj-redSoft group-hover:text-kcj-red"><UIIcon name={moduleIcon[m.slug]} size={23}/></div>
      <div className="min-w-0 flex-1"><h4 className="font-bold text-kcj-charcoal">{m.title}</h4><p className="mt-1 text-xs leading-5 text-slate-500">{highlights[m.slug]}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-kcj-red">Abrir proceso <UIIcon name="arrow" size={13}/></span></div>
     </Link>)}
    </div>
   </div>)}
  </section>
 </>;
}
