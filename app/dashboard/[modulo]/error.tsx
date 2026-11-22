"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

/** Límite de error del módulo, separado de la navegación y del dashboard. */
export default function ModuleError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 const pathname=usePathname();
 return <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
  <p className="text-xs font-bold uppercase tracking-wide">KCJ CONTROL · Carga de módulo</p>
  <h2 className="mt-2 text-xl font-bold">No fue posible cargar los registros de este módulo</h2>
  <p className="mt-3 text-sm leading-6">La pantalla está disponible, pero una consulta o un componente no terminó de cargar. Esto <strong>no</strong> significa que los registros hayan sido borrados. TI debe comprobar el estado de PostgreSQL, las tablas, las migraciones y los errores del despliegue.</p>
  {error.digest&&<p className="mt-3 text-xs">Referencia para TI: <code className="font-mono">{error.digest}</code></p>}
  <div className="mt-5 flex flex-wrap gap-3">
   <button type="button" onClick={reset} className="rounded-lg bg-kcj-red px-4 py-2 text-sm font-semibold text-white">Reintentar la carga</button>
   <Link href="/dashboard" className="rounded-lg border border-amber-400 px-4 py-2 text-sm font-semibold">Volver al panel</Link>
   {pathname==="/dashboard/personal"&&<Link href="/api/diagnostico/colaboradores" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-amber-500 px-4 py-2 text-sm font-semibold">Diagnóstico Colaboradores (solo ADMIN)</Link>}
  </div>
 </section>;
}
