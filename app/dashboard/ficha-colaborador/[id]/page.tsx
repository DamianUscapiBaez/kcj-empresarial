import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {requireUser} from "@/lib/auth";
import {panelActual} from "@/lib/panel-sesion";
import {rolesParaPanel} from "@/lib/paneles-kcj";
import {canAccess} from "@/lib/modulos";
import {errorEstructuraPrisma} from "@/lib/colaboradores-compat";
import {DataTable} from "@/components/ui/fields";
import {actualizarDatosContactoLicencia} from "@/app/actions-operativas";
import {CATEGORIAS_LICENCIA_KCJ} from "@/lib/licencia-colaborador";

const fmt=(date:Date|null|undefined)=>date?new Intl.DateTimeFormat("es-PE",{dateStyle:"medium",timeZone:"America/Lima"}).format(date):"—";
const cell=(value:string|null|undefined)=>value?.trim()||"—";
const fechaHora=(date:Date|null|undefined)=>date?new Intl.DateTimeFormat("es-PE",{dateStyle:"short",timeStyle:"short",timeZone:"America/Lima"}).format(date):"—";

/** Ficha única del trabajador: utiliza siempre su ID, sin crear otra identidad ni duplicar datos. */
export default async function FichaColaborador({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const user=await requireUser();
 const panel=await panelActual(user);
 if(!panel)redirect("/seleccionar-panel");
 // Los permisos deben comprobarse en el servidor, incluso si se conoce la URL.
 if(panel==="conductor"||!canAccess(rolesParaPanel(user,panel),"personal"))notFound();

 // Compatible temporalmente con despliegues que aún no tienen la columna secondaryArea.
 const base={id:true,document:true,name:true,job:true,area:true,active:true,license:true,licenseExpires:true,entryDate:true} as const;
 let contactoPendiente=false;
 let colaborador;
 let segundaAreaPendiente=false;
 try{
  colaborador=await prisma.worker.findUnique({where:{id},select:{...base,secondaryArea:true,phone:true,licenseCategory:true,licenseIssuedAt:true}});
 }catch(error:unknown){
  if(!errorEstructuraPrisma(error))throw error;
  contactoPendiente=true;
  try{
   const anterior=await prisma.worker.findUnique({where:{id},select:{...base,secondaryArea:true}});
   colaborador=anterior?{...anterior,phone:null,licenseCategory:null,licenseIssuedAt:null}:null;
  }catch(errorAnterior:unknown){
   if(!errorEstructuraPrisma(errorAnterior))throw errorAnterior;
   const baseAnterior=await prisma.worker.findUnique({where:{id},select:base});
   colaborador=baseAnterior?{...baseAnterior,secondaryArea:null,phone:null,licenseCategory:null,licenseIssuedAt:null}:null;
   segundaAreaPendiente=true;
  }
 }
 if(!colaborador)notFound();

 // La ficha no expone contraseñas, diagnósticos, historias médicas ni documentos privados.
 // Los demás módulos siguen administrando sus propios datos, sin copiar la ficha personal.
 const permisos=rolesParaPanel(user,panel);
 const verHomologacion=canAccess(permisos,"homologacion");
 const verRoster=canAccess(permisos,"roster");
 const [cuenta,certificaciones,guardias]=await Promise.all([
  permisos.includes("ADMIN")
   ?prisma.user.findUnique({where:{workerId:id},select:{login:true,active:true,role:true}})
   :Promise.resolve(null),
  verHomologacion?prisma.clearance.findMany({where:{workerId:id,kind:{in:["CONDUCTOR_MINA","CURSO_EXTERNO"]}},select:{id:true,kind:true,scope:true,reference:true,validUntil:true,verified:true},orderBy:{createdAt:"desc"},take:30}):Promise.resolve([]),
  verRoster?prisma.roster.findMany({where:{workerId:id},select:{id:true,kind:true,startsAt:true,endsAt:true,status:true},orderBy:{startsAt:"desc"},take:20}):Promise.resolve([])
 ]);
 return <div className="space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <Link href="/dashboard/personal" className="text-sm font-semibold text-kcj-red underline underline-offset-4">← Volver a Colaboradores</Link>
   <span className="rounded-full border border-kcj-border bg-white px-3 py-1 text-xs font-semibold">{colaborador.active?"Colaborador activo":"Colaborador inactivo"}</span>
  </div>
  <header className="card space-y-2">
   <p className="kcj-eyebrow">KCJ CONTROL · Ficha única del colaborador</p>
   <h1 className="text-2xl font-black text-kcj-charcoal">{colaborador.name}</h1>
   <p className="text-sm text-slate-600">DNI {colaborador.document} · {colaborador.area}</p>
  </header>
  <section className="card space-y-3">
   <h2 className="text-lg font-black text-kcj-charcoal">Datos laborales</h2>
   <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div><dt className="text-xs font-semibold text-slate-500">Documento de identidad</dt><dd className="mt-1 font-medium">{colaborador.document}</dd></div>
    <div><dt className="text-xs font-semibold text-slate-500">Cargo registrado</dt><dd className="mt-1 font-medium">{cell(colaborador.job)}</dd></div>
    <div><dt className="text-xs font-semibold text-slate-500">Área principal</dt><dd className="mt-1 font-medium">{cell(colaborador.area)}</dd></div>
    <div><dt className="text-xs font-semibold text-slate-500">Segunda área</dt><dd className="mt-1 font-medium">{segundaAreaPendiente?"No disponible (migración pendiente)":cell(colaborador.secondaryArea)}</dd></div>
    <div><dt className="text-xs font-semibold text-slate-500">Fecha de ingreso</dt><dd className="mt-1 font-medium">{fmt(colaborador.entryDate)}</dd></div>
    <div><dt className="text-xs font-semibold text-slate-500">Estado laboral</dt><dd className="mt-1 font-medium">{colaborador.active?"Activo":"Inactivo"}</dd></div>
   </dl>
   <p className="text-xs text-slate-600">Los cambios de datos personales se realizan desde Colaboradores, por personal autorizado. No se crean fichas duplicadas.</p>
  </section>
  <section className="card space-y-3">
   <h2 className="text-lg font-black text-kcj-charcoal">Datos de contacto</h2>
   <p className="text-sm">Celular: <strong>{rolesParaPanel(user,panel).some(r=>["ADMIN","RRHH","OPERACIONES","JEFE_OPERACIONES","GERENCIA"].includes(r))?cell(colaborador.phone):"Dato restringido"}</strong></p>
   <p className="text-xs text-slate-600">Solo consulta del número: no se realizan llamadas desde KCJ CONTROL.</p>
  </section>
  <section className="card space-y-3">
   <h2 className="text-lg font-black text-kcj-charcoal">Licencia de conducir (opcional para cualquier colaborador)</h2>
   <dl className="grid gap-4 sm:grid-cols-2">
    <div><dt className="text-xs font-semibold text-slate-500">Número de licencia</dt><dd className="mt-1 font-medium">{cell(colaborador.license)}</dd></div>
    <div><dt className="text-xs font-semibold text-slate-500">Categoría</dt><dd className="mt-1 font-medium">{cell(colaborador.licenseCategory)}</dd></div>
    <div><dt className="text-xs font-semibold text-slate-500">Emisión</dt><dd className="mt-1 font-medium">{fmt(colaborador.licenseIssuedAt)}</dd></div>
    <div><dt className="text-xs font-semibold text-slate-500">Vencimiento</dt><dd className="mt-1 font-medium">{fmt(colaborador.licenseExpires)}</dd></div>
   </dl>
   <p className="text-xs text-slate-600">Tener licencia no equivale a estar habilitado como conductor de KCJ.</p>
  </section>
  {rolesParaPanel(user,panel).some(r=>["ADMIN","RRHH"].includes(r))&&!contactoPendiente&&
   <section className="card space-y-3">
    <h2 className="text-lg font-black">Actualizar celular y licencia</h2>
    <p className="text-sm text-slate-600">Edita únicamente la información de esta ficha. Deja la licencia vacía si no tiene una registrada.</p>
    <form action={actualizarDatosContactoLicencia} className="grid gap-3 sm:grid-cols-2">
     <input type="hidden" name="id" value={id}/>
     <label className="text-sm font-medium">Celular<input className="input mt-1" type="tel" name="phone" defaultValue={colaborador.phone??""}/></label>
     <label className="text-sm font-medium">Número de licencia<input className="input mt-1" name="license" defaultValue={colaborador.license??""}/></label>
     <label className="text-sm font-medium">Categoría<select name="licenseCategory" className="input mt-1" defaultValue={colaborador.licenseCategory??""}><option value="">Sin categoría</option>{CATEGORIAS_LICENCIA_KCJ.map(c=><option value={c} key={c}>{c}</option>)}</select></label>
     <label className="text-sm font-medium">Emisión<input className="input mt-1" type="date" name="licenseIssuedAt" defaultValue={colaborador.licenseIssuedAt?.toISOString().slice(0,10)??""}/></label>
     <label className="text-sm font-medium">Vencimiento<input className="input mt-1" type="date" name="licenseExpires" defaultValue={colaborador.licenseExpires?.toISOString().slice(0,10)??""}/></label>
     <label className="text-sm font-medium">Motivo de actualización *<input className="input mt-1" name="reason" required minLength={5} maxLength={500} placeholder="Ej.: Actualización de contacto"/></label>
     <button type="submit" className="btn sm:col-span-2">Guardar contacto y licencia</button>
    </form>
   </section>}
  {cuenta&&<section className="card space-y-2"><h2 className="text-lg font-black text-kcj-charcoal">Cuenta vinculada (solo administración)</h2><p className="text-sm">Usuario: <strong>{cuenta.login}</strong> · Estado: <strong>{cuenta.active?"Habilitada":"Deshabilitada"}</strong></p><p className="text-xs text-slate-600">La contraseña no se muestra. Gestiona permisos y restablecimientos desde Centro de Control.</p><Link href="/dashboard/acceso" className="inline-block text-sm font-semibold text-kcj-red underline">Abrir Centro de Control</Link></section>}
  {verHomologacion&&<section className="space-y-2"><h2 className="text-lg font-black text-kcj-charcoal">Homologación del personal</h2><DataTable title="Certificaciones externas del colaborador" emptyMessage="No existen certificaciones personales registradas para este trabajador." rows={certificaciones.map(c=>({id:c.id,data:{Tipo:c.kind==="CONDUCTOR_MINA"?"Homologación personal para mina":"Curso / acreditación externa",Operación:c.scope,Referencia:cell(c.reference),Vencimiento:fmt(c.validUntil),Verificación:c.verified?"Verificada":"Pendiente"}}))}/></section>}
  {verRoster&&<section className="space-y-2"><h2 className="text-lg font-black text-kcj-charcoal">ROSTER del colaborador</h2><DataTable title="Guardias y descansos recientes" emptyMessage="Todavía no hay guardias o descansos registrados para esta persona." rows={guardias.map(g=>({id:g.id,data:{Tipo:g.kind,Inicio:fechaHora(g.startsAt),Fin:fechaHora(g.endsAt),Estado:g.status}}))}/></section>}
 </div>;
}
