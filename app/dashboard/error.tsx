"use client";
export default function DashboardError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <div role="alert" className="card space-y-3 border-l-4 !border-l-kcj-red"><p className="kcj-eyebrow">Se produjo un error</p><h2 className="text-xl font-bold text-kcj-charcoal">No se pudo completar esta operación</h2><p className="text-sm leading-6 text-slate-600">Verifica los datos y permisos. Si el problema persiste, comunica a TI la referencia para revisar los registros del servidor.</p>{error.digest&&<p className="font-mono text-xs text-slate-500">Referencia: {error.digest}</p>}<button onClick={reset} className="btn">Volver a intentar</button></div>;
}
