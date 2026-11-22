import {login} from "@/app/actions-auth";
import {KcjLogo} from "@/components/ui/KcjLogo";
import {UIIcon} from "@/components/ui/ModuleIcon";
export default async function LoginPage({searchParams}:{searchParams:Promise<{error?:string}>}){
 const params=await searchParams;
 return <main className="min-h-screen bg-kcj-paper lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,600px)]">
  <section className="relative hidden flex-col justify-between overflow-hidden bg-kcj-dark px-12 py-12 text-white lg:flex xl:px-20">
   <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full border-[70px] border-white/[.035]"/>
   <div className="pointer-events-none absolute -top-20 right-1/3 h-72 w-72 rounded-full border-[48px] border-white/[.025]"/>
   <div><KcjLogo size="large"/><p className="mt-5 text-sm font-semibold uppercase tracking-[.22em] text-slate-300">KCJ PERÚ S.A.C.</p></div>
   <div className="relative max-w-lg"><span className="inline-flex rounded-full border border-rose-300/30 bg-kcj-red/20 px-4 py-1.5 text-xs font-semibold text-[#F9E6EA]">Plataforma empresarial</span><h1 className="mt-7 text-5xl font-black leading-[1.12] tracking-tight xl:text-6xl">La operación de KCJ,<br/><span className="text-[#F6D5DC]">en un solo lugar.</span></h1><p className="mt-6 max-w-md text-base leading-8 text-slate-300">Información compartida de forma segura para Operaciones, SSOMA, Recursos Humanos, Mantenimiento y las demás funciones autorizadas.</p><div className="mt-8 flex items-center gap-3 text-sm text-slate-300"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10"><UIIcon name="shield" size={20}/></span> Acceso privado según funciones autorizadas</div></div>
   <p className="relative text-xs font-medium text-slate-200">KCJ CONTROL · Uso corporativo autorizado</p>
  </section>
  <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10 lg:px-12">
   <div className="w-full max-w-md">
    <div className="mb-8 lg:hidden"><KcjLogo size="large"/></div>
    <div className="mb-8"><p className="kcj-eyebrow">Acceso seguro</p><h2 className="mt-2 text-3xl font-black tracking-tight text-kcj-charcoal">Bienvenido a KCJ CONTROL</h2><p className="mt-2 text-sm leading-6 text-kcj-muted">Ingresa con tu cuenta corporativa asignada por Administración.</p></div>
    <div className="rounded-3xl border border-kcj-border bg-white p-6 shadow-pane sm:p-8">
     {params.error&&<div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">No pudimos validar el acceso. Revisa tus datos y vuelve a intentarlo.</div>}
     <form action={login} className="space-y-5">
      <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Documento o usuario</span><input className="input" name="login" required minLength={4} autoComplete="username" placeholder="Ingresa tu usuario"/></label>
      <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Contraseña</span><input className="input" type="password" name="password" required autoComplete="current-password" placeholder="Ingresa tu contraseña"/></label>
      <button type="submit" className="btn w-full py-3">Ingresar al sistema <UIIcon name="arrow" size={16}/></button>
     </form>
     <div className="mt-6 flex items-start gap-2 border-t border-slate-100 pt-5 text-xs leading-5 text-kcj-muted"><UIIcon name="shield" size={17} className="mt-0.5 shrink-0 text-kcj-red"/>Tus datos y acciones están protegidos por permisos del sistema.</div>
    </div>
    <p className="mt-6 text-center text-xs text-kcj-muted">¿No puedes acceder? Comunícate con Administración o TI.</p>
   </div>
  </section>
 </main>;
}
