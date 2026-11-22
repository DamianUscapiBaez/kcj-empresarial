"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import type {PointerEvent as ReactPointerEvent} from "react";
import {useRouter} from "next/navigation";
import {registrarFirmaCustodia} from "@/app/actions-firmas-custodia";
import {firmaConTrazoSuficiente} from "@/lib/custodia-trazos";

type Point={x:number;y:number};
type Stroke=Point[];
type Props={eventId:string;side:"ENTREGA"|"RECIBE";signerName:string};
type UploadResponse={url?:string;key?:string;error?:string};
const color="#14232b";

function drawLines(ctx:CanvasRenderingContext2D,strokes:Stroke[],width:number,height:number,strokeSize:number){
 ctx.lineWidth=strokeSize;ctx.lineJoin="round";ctx.lineCap="round";ctx.strokeStyle=color;
 for(const stroke of strokes){if(!stroke.length)continue;ctx.beginPath();ctx.moveTo(stroke[0].x*width,stroke[0].y*height);
  for(let i=1;i<stroke.length;i++)ctx.lineTo(stroke[i].x*width,stroke[i].y*height);
  ctx.stroke();
 }
}

/** El recuadro NO limita el espacio de firma: al tocarlo abre un lienzo grande. */
export function FirmaCustodiaAmpliada({eventId,side,signerName}:Props){
 const router=useRouter();
 const [open,setOpen]=useState(false),[saving,setSaving]=useState(false),[accepted,setAccepted]=useState(false),[hasInk,setHasInk]=useState(false),[error,setError]=useState("");
 const canvasRef=useRef<HTMLCanvasElement|null>(null);
 const strokesRef=useRef<Stroke[]>([]);
 const drawingRef=useRef(false);
 const pointerRef=useRef<number|null>(null);
 const label=side==="ENTREGA"?"quien entrega":"quien recibe";

 const repaint=useCallback(()=>{
  const canvas=canvasRef.current; if(!canvas)return;
  const rect=canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return;
  const ratio=Math.min(window.devicePixelRatio||1,3);
  canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);
  const ctx=canvas.getContext("2d");if(!ctx)return;
  ctx.setTransform(ratio,0,0,ratio,0,0);
  ctx.clearRect(0,0,rect.width,rect.height);
  drawLines(ctx,strokesRef.current,rect.width,rect.height,Math.max(2.4,rect.width*0.003));
 },[]);

 useEffect(()=>{
  if(!open)return;
  const original=document.body.style.overflow;document.body.style.overflow="hidden";
  const listener=(e:KeyboardEvent)=>{if(e.key==="Escape"&&!saving)setOpen(false)};
  window.addEventListener("keydown",listener);
  const observer=new ResizeObserver(repaint);
  if(canvasRef.current)observer.observe(canvasRef.current);
  repaint();
  return ()=>{observer.disconnect();window.removeEventListener("keydown",listener);document.body.style.overflow=original;};
 },[open,repaint,saving]);

 const point=(e:ReactPointerEvent<HTMLCanvasElement>):Point=>{
  const rect=e.currentTarget.getBoundingClientRect();
  return {x:Math.min(1,Math.max(0,(e.clientX-rect.left)/Math.max(rect.width,1))),y:Math.min(1,Math.max(0,(e.clientY-rect.top)/Math.max(rect.height,1)))};
 };
 const begin=(e:ReactPointerEvent<HTMLCanvasElement>)=>{
  if(saving||drawingRef.current)return;
  if(e.pointerType==="mouse"&&e.button!==0)return;
  e.preventDefault();drawingRef.current=true;pointerRef.current=e.pointerId;
  e.currentTarget.setPointerCapture(e.pointerId);
  strokesRef.current.push([point(e)]);setHasInk(true);repaint();
 };
 const move=(e:ReactPointerEvent<HTMLCanvasElement>)=>{
  if(!drawingRef.current||pointerRef.current!==e.pointerId)return;
  e.preventDefault();const line=strokesRef.current.at(-1);if(!line)return;
  if(line.length<2500)line.push(point(e));repaint();
 };
 const end=(e:ReactPointerEvent<HTMLCanvasElement>)=>{
  if(pointerRef.current!==e.pointerId)return;
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  drawingRef.current=false;pointerRef.current=null;
 };
 const clear=()=>{strokesRef.current=[];drawingRef.current=false;pointerRef.current=null;setHasInk(false);setError("");repaint();};
 const openPad=()=>{strokesRef.current=[];setHasInk(false);setAccepted(false);setError("");setOpen(true);};

 async function uploadSignature(blob:Blob):Promise<string>{
  const filename=`firma-custodia-${side.toLowerCase()}-${eventId}.png`;
  const r=await fetch("/api/evidencias/presign",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename,mime:"image/png",bytes:blob.size,purpose:"CUSTODIA"})});
  const d:UploadResponse=await r.json();if(!r.ok||!d.key||!d.url)throw new Error(d.error||"No se pudo preparar la carga de la firma");
  const put=await fetch(d.url,{method:"PUT",headers:{"Content-Type":"image/png","If-None-Match":"*"},body:blob});if(!put.ok)throw new Error("No se pudo guardar la imagen en el almacenamiento privado");
  const check=await fetch("/api/evidencias/confirmar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:d.key})});
  if(!check.ok)throw new Error("No se pudo verificar el archivo de firma cargado");
  return d.key;
 }
 async function confirm(){
  if(!accepted){setError("Confirma que la persona revisó el acta y firmó en tu presencia.");return;}
  if(!firmaConTrazoSuficiente(strokesRef.current)){setError("La firma está vacía o es demasiado breve. Firma en el recuadro grande.");return;}
  setSaving(true);setError("");
  try{
   // Exportación independiente del tamaño de la pantalla: conserva los trazos normalizados.
   const rect=canvasRef.current?.getBoundingClientRect();
   if(!rect||rect.width<1||rect.height<1)throw new Error("Área de firma no disponible");
   const output=document.createElement("canvas");
   const scale=Math.min(3,1200/rect.width,900/rect.height);
   output.width=Math.max(1,Math.round(rect.width*scale));output.height=Math.max(1,Math.round(rect.height*scale));
   const ctx=output.getContext("2d");if(!ctx)throw new Error("Este dispositivo no permite guardar trazos");
   drawLines(ctx,strokesRef.current,output.width,output.height,Math.max(3,output.width*0.003));
   const blob=await new Promise<Blob>((resolve,reject)=>output.toBlob(b=>b?resolve(b):reject(new Error("No se pudo generar el PNG")),"image/png"));
   if(blob.size>3*1024*1024)throw new Error("La firma supera el tamaño permitido");
   const evidenceKey=await uploadSignature(blob);
   await registrarFirmaCustodia({eventId,side,evidenceKey,witnessedInPerson:true});
   setOpen(false);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"No se pudo registrar la firma. Inténtalo de nuevo.");}
  finally{setSaving(false);}
 }
 return <>
  <button type="button" onClick={openPad} className="signature-button flex min-h-28 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-400 bg-slate-50 p-4 text-center transition hover:border-kcj-red hover:bg-kcj-redSoft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kcj-red" aria-label={`Tocar para ampliar el espacio de firma de ${signerName}`}>
   <span className="text-sm font-bold text-slate-900">Tocar para firmar en grande</span>
   <span className="mt-1 text-xs text-slate-700">{signerName}</span>
   <span className="mt-1 text-[11px] text-slate-600">Firma de {label} · dedo, lápiz o mouse</span>
  </button>
  {open&&<div className="signature-dialog fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 p-2 sm:p-6" role="dialog" aria-modal="true" aria-label={`Firma ampliada de ${signerName}`}>
   <div className="flex h-[min(96dvh,820px)] w-full max-w-6xl flex-col gap-3 overflow-y-auto rounded-2xl bg-white p-3 shadow-2xl sm:p-6">
    <header className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-black sm:text-2xl">Firma ampliada · {label}</h2><p className="text-xs text-slate-700 sm:text-sm">{signerName} · Revisa el acta antes de firmar. Puedes girar el celular horizontalmente para tener más espacio.</p></div><button type="button" disabled={saving} onClick={()=>setOpen(false)} className="btn-secondary shrink-0" aria-label="Cerrar sin guardar">Cerrar</button></header>
    <div className="relative min-h-[220px] flex-1 overflow-hidden rounded-xl border-2 border-slate-400 bg-white" style={{minHeight:"220px"}}>
     <canvas ref={canvasRef} aria-label="Área grande para dibujar la firma" role="img" className="absolute inset-0 h-full w-full cursor-crosshair" style={{touchAction:"none"}} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end}/>
     {!hasInk&&<p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-sm text-slate-400">Firme aquí con el dedo, lápiz táctil o mouse</p>}
    </div>
    <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-xs leading-5 sm:text-sm"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} disabled={saving} className="mt-1 h-4 w-4 shrink-0"/><span>Confirmo que <strong>{signerName}</strong> revisó el acta y realizó personalmente esta firma en mi presencia. La firma dibujada no equivale a una firma digital certificada.</span></label>
    {error&&<p role="alert" className="rounded-lg bg-rose-50 p-2 text-sm font-semibold text-rose-800">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={clear} disabled={saving} className="btn-secondary">Borrar y repetir</button><button type="button" onClick={()=>setOpen(false)} disabled={saving} className="btn-secondary">Cancelar</button><button type="button" onClick={()=>void confirm()} disabled={saving||!hasInk||!accepted} className="btn">{saving?"Guardando firma…":"Confirmar firma"}</button></div>
   </div>
  </div>}
 </>;
}
