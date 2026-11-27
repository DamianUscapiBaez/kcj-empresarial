"use client";
import {useState,useMemo} from 'react';
import {EvidenceUploader} from '@/components/ui/EvidenceUploader';
import {catalogoRutina,validarRutina,type Ambito,type ConfigEquipo,type RespuestaRutina} from '@/lib/inspeccion-rutina';
import {validarNeumaticosRutina,type NeumaticoRutina} from '@/lib/neumaticos-rutina';
import type {ResultadoItem} from '@/lib/vehiculos-integrados';
export function InspeccionRutinaForm({vehicleId,tipo,equipment,eventId,inspector,action}:{vehicleId:string;tipo:string;equipment:ConfigEquipo[];eventId:string;inspector:string;action:(f:FormData)=>Promise<void>}){
 const [ambito,setAmbito]=useState<Ambito>('INSITE'),[escolta,setEscolta]=useState(false),[patrulla,setPatrulla]=useState(false),[mina,setMina]=useState(false);
 const blankTire=():NeumaticoRutina=>({position:'',brand:'',size:'',condition:'',depth:'',pressure:''});
 const [tires,setTires]=useState<NeumaticoRutina[]>([blankTire()]);
 const [answers,setAnswers]=useState<Record<string,Partial<RespuestaRutina>>>({});
 const items=useMemo(()=>catalogoRutina(tipo,equipment,ambito,escolta,patrulla,mina),[tipo,equipment,ambito,escolta,patrulla,mina]);
 const set=(code:string,value:Partial<RespuestaRutina>)=>setAnswers(prev=>({...prev,[code]:{...prev[code],...value}}));
 const total=items.filter(x=>answers[x.code]?.result).length;
 let error='';try{validarRutina(items,items.map(x=>({code:x.code,result:answers[x.code]?.result??'' as ResultadoItem,note:answers[x.code]?.note??'',found:x.quantity&&answers[x.code]?.result!=='NO_APLICA'?answers[x.code]?.found??null:null,detail:answers[x.code]?.detail??''})));}catch(e){error=e instanceof Error?e.message:'Revisa las respuestas';}
 let tireError='';try{validarNeumaticosRutina(tires);if(tires.some(t=>t.condition!=='CONFORME')&&answers.NEUM_CONFIG?.result==='CONFORME')throw new Error('La evaluación de neumáticos debe reflejar los hallazgos individuales.');}catch(e){tireError=e instanceof Error?e.message:'Revisa neumáticos';}
 const hasFindings=items.some(x=>['OBSERVADO','NO_CONFORME'].includes(answers[x.code]?.result??''));
 return <form action={action} className="card space-y-4">
 <h2 className="kcj-card-heading">Nueva inspección integral de rutina</h2>
 <p className="text-sm">Inspector: <strong>{inspector}</strong>. No cambia la custodia ni sustituye la inspección preoperacional. Verifica físicamente cada componente; ninguna respuesta viene marcada.</p>
 <input type="hidden" name="vehicleId" value={vehicleId}/><input type="hidden" name="clientEventId" value={eventId}/>
 <div className="grid gap-3 sm:grid-cols-2">
 <label>Ámbito de servicio<select className="input" name="ambito" value={ambito} onChange={e=>{setAmbito(e.target.value as Ambito);setEscolta(false);setAnswers({});}}><option>INSITE</option><option>OFFSITE</option><option>MIXTO</option></select></label>
 <label>Lugar de inspección<input name="location" required maxLength={160} className="input"/></label>
 <label>Kilometraje observado (km)<input name="kilometers" type="number" min="0" step="1" max="10000000" required className="input"/></label>
 <label>Combustible (nivel observado)<select name="fuel" className="input" required><option value="">Seleccionar</option><option value="E">E / vacío</option><option value="1/4">1/4</option><option value="1/2">1/2</option><option value="3/4">3/4</option><option value="F">F / lleno</option></select></label>
 <label><input type="checkbox" name="accesoMina" checked={mina} onChange={e=>{setMina(e.target.checked);setAnswers({});}}/> Acceso a mina</label>
 {tipo==='CAMIONETA'&&<><label><input type="checkbox" name="escolta" disabled={ambito==='INSITE'} checked={escolta} onChange={e=>{setEscolta(e.target.checked);setAnswers({});}}/> Escolta OFFSITE</label><label><input type="checkbox" name="patrulla" checked={patrulla} onChange={e=>{setPatrulla(e.target.checked);setAnswers({});}}/> Patrulla</label></>}
 </div>
 <p className="text-xs text-slate-600">Cambiar el ámbito o alcance reinicia las respuestas para evitar aplicar requisitos incorrectos. Las cantidades de referencia proceden del formato KCJ y del inventario configurado; verificar su vigencia y aplicabilidad.</p>
 <p className="font-semibold">Respondidos: {total} de {items.length}</p>
 {Array.from(new Set(items.map(x=>x.category))).map(category=><details key={category} open className="rounded-lg border border-kcj-border p-3"><summary className="cursor-pointer font-semibold">{category} ({items.filter(x=>x.category===category&&answers[x.code]?.result).length}/{items.filter(x=>x.category===category).length})</summary>
 {items.filter(x=>x.category===category).map(x=>{const a=answers[x.code]??{};return <div key={x.code} className="border-t border-kcj-border py-3 space-y-2"><p className="font-medium">{x.label}</p><p className="text-xs">{x.quantity?`Cantidad requerida: ${x.minimum??'según configuración real'}`:'Verificación de condición'} · {x.reference}{x.critical?' · Crítico si no cumple':''}</p>
 <div className="grid sm:grid-cols-2 gap-2"><label>Resultado<select required className="input" name={`resultado_${x.code}`} value={a.result??''} onChange={e=>set(x.code,{result:e.target.value as ResultadoItem,found:e.target.value==='NO_APLICA'?null:a.found})}><option value="">Seleccionar</option><option value="CONFORME">Cumple</option><option value="OBSERVADO">Observado</option><option value="NO_CONFORME">No cumple</option>{!x.mandatory&&<option value="NO_APLICA">No aplica</option>}</select></label>
 {x.quantity&&a.result!=='NO_APLICA'&&<label>Cantidad encontrada<input type="number" name={`cantidad_${x.code}`} min="0" max="10000" step="1" className="input" required value={a.found??''} onChange={e=>set(x.code,{found:e.target.value===''?null:Number(e.target.value)})}/></label>}</div>
 {a.result&&a.result!=='CONFORME'&&<label>Motivo / hallazgo<textarea required minLength={5} maxLength={800} className="input" rows={2} name={`nota_${x.code}`} value={a.note??''} onChange={e=>set(x.code,{note:e.target.value})}/></label>}
 {a.result!=='NO_APLICA'&&<label>Detalle {x.code==='NEUM_CONFIG'?'(una línea por eje/posición: marca, medida, DOT, mm, PSI, condición)':x.category.startsWith('Botiquín')?'(vencimiento y lote según corresponda)':'(marca, medida, serie, vencimiento, condición u otros)'}<textarea className="input" rows={x.code==='NEUM_CONFIG'?5:1} maxLength={6000} name={`detalle_${x.code}`} value={a.detail??''} onChange={e=>set(x.code,{detail:e.target.value})}/></label>}
 </div>})}</details>)}
 <section className="space-y-3 rounded-lg border border-kcj-border p-3"><h3 className="font-bold">Neumáticos por posición real (incluye repuestos)</h3><p className="text-sm">Añade cada rueda que posee la unidad. No se presume una cantidad fija. Para medición no realizada escribe NO_MEDIDO y registra la observación correspondiente.</p><input type="hidden" name="tires" value={JSON.stringify(tires)}/>{tires.map((t,i)=><div className="grid gap-2 sm:grid-cols-3 border-b pb-3" key={i}>{(['position','brand','size','depth','pressure'] as const).map((k,j)=><label key={k}>{['Eje y posición','Marca','Medida','Cocada (mm)','Presión (PSI)'][j]}<input className="input" required maxLength={80} value={t[k]} onChange={e=>setTires(prev=>prev.map((v,n)=>n===i?{...v,[k]:e.target.value}:v))}/></label>)}<label>Condición<select className="input" required value={t.condition} onChange={e=>setTires(prev=>prev.map((v,n)=>n===i?{...v,condition:e.target.value}:v))}><option value="">Seleccionar</option><option>CONFORME</option><option>OBSERVADO</option><option>NO_CONFORME</option></select></label>{tires.length>1&&<button type="button" className="btn-secondary" onClick={()=>setTires(prev=>prev.filter((_,n)=>n!==i))}>Quitar posición</button>}</div>)}<button type="button" className="btn-secondary" disabled={tires.length>=40} onClick={()=>setTires(prev=>[...prev,blankTire()])}>Agregar neumático o repuesto</button>{tireError&&<p className="text-sm text-amber-800">{tireError}</p>}</section>
 <label>Acciones correctivas / responsable propuesto / plazo<textarea className="input" rows={3} name="actions" maxLength={2000} required={hasFindings} minLength={hasFindings?5:undefined}/></label>
 <div><p className="font-medium">Evidencia general (opcional)</p><EvidenceUploader name="overallEvidenceKey" purpose="FLOTA"/></div>
 <label className="block"><input type="checkbox" required name="confirm"/> Confirmo que he realizado la inspección y que los datos corresponden a lo observado.</label>
 {error&&<p className="text-sm text-amber-800">{total<items.length?'Completa todos los componentes.':error}</p>}
 <button className="btn" type="submit" disabled={Boolean(error||tireError)}>Guardar inspección de rutina</button>
 </form>;
}
