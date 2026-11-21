"use client";
export default function DashboardError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <div role="alert" className="card space-y-3 border-l-4 !border-l-kcj-red"><p className="kcj-eyebrow">Se produjo un error</p><h2 className="text-xl font-bold text-kcj-charcoal">No se pudo completar esta operación</h2><p className="text-sm leading-6 text-slate-600">No se pudo cargar este contenido. Puede tratarse de una consulta a PostgreSQL, una tabla sin migrar o un error del servidor. No significa que los registros se hayan eliminado. Comparte la referencia con TI.</p>{error.digest&&<p className="font-mono text-xs text-slate-500">Referencia: {error.digest}</p>}<button onClick={reset} className="btn">Volver a intentar</button></div>;
}
