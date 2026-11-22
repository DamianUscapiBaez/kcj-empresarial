"use client";
import {useRef,useState} from "react";
const LIMITE=4;
type Foto={key:string;name:string};
type Respuesta={url?:string;key?:string;error?:string};
/** Galería de hasta cuatro fotos por componente, capturadas ANTES de guardar y firmar el acta. */
export function FotosCustodiaUploader({itemCode,label}:{itemCode:string;label:string}){
 const [photos,setPhotos]=useState<Foto[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const cameraRef=useRef<HTMLInputElement|null>(null);
 const galleryRef=useRef<HTMLInputElement|null>(null);
 async function subir(files:FileList|null){
  if(!files?.length)return;
  setError("");setBusy(true);
  try{
   const selected=Array.from(files);
   if(photos.length+selected.length>LIMITE)throw new Error(`Máximo ${LIMITE} fotos por componente`);
   for(const file of selected){
    if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("Solo imágenes JPG, PNG o WebP");
    if(file.size<1||file.size>10*1024*1024)throw new Error("Cada foto debe tener entre 1 byte y 10 MB");
    const r=await fetch("/api/evidencias/presign",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:file.name,mime:file.type,bytes:file.size,purpose:"CUSTODIA"})});
    const presign:Respuesta=await r.json();if(!r.ok||!presign.url||!presign.key)throw new Error(presign.error||"No se pudo preparar la fotografía");
    const put=await fetch(presign.url,{method:"PUT",headers:{"Content-Type":file.type,"If-None-Match":"*"},body:file});if(!put.ok)throw new Error("No se pudo cargar una fotografía");
    const check=await fetch("/api/evidencias/confirmar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:presign.key})});
    if(!check.ok)throw new Error("No se pudo verificar una fotografía");
    setPhotos(prev=>[...prev,{key:presign.key!,name:file.name}]);
   }
  }catch(e){setError(e instanceof Error?e.message:"Error al subir imágenes");}
  finally{setBusy(false);if(cameraRef.current)cameraRef.current.value="";if(galleryRef.current)galleryRef.current.value="";}
 }
 return <div className="space-y-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
  <p className="text-xs font-semibold text-slate-800">Fotos del componente: {label} · {photos.length}/{LIMITE}</p>
  <div className="flex flex-wrap gap-2">
   <label className="inline-flex cursor-pointer items-center rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:border-kcj-red">Tomar foto
    <input ref={cameraRef} className="sr-only" type="file" accept="image/*" capture="environment" disabled={busy||photos.length>=LIMITE} aria-label={`Tomar foto de ${label}`} onChange={e=>void subir(e.target.files)}/>
   </label>
   <label className="inline-flex cursor-pointer items-center rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:border-kcj-red">Seleccionar de galería
    <input ref={galleryRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy||photos.length>=LIMITE} aria-label={`Seleccionar fotos de ${label}`} onChange={e=>void subir(e.target.files)}/>
   </label>
  </div>
  <p className="text-xs text-slate-600">Usa la cámara o galería del dispositivo. Se exige al menos una foto si se registra daño o condición observada. No es obligatorio para un faltante sin daño.</p>
  <ul className="space-y-1">{photos.map(p=><li key={p.key} className="flex items-center justify-between gap-2 text-xs"><span className="min-w-0 truncate" title={p.name}>✓ {p.name}</span><button type="button" disabled={busy} onClick={()=>setPhotos(old=>old.filter(x=>x.key!==p.key))} className="font-semibold text-kcj-red underline" aria-label={`Quitar ${p.name}`}>Quitar</button></li>)}</ul>
  {photos.map(p=><input type="hidden" name={`photos_${itemCode}`} value={p.key} key={p.key}/>)}
  {error&&<p role="alert" className="text-xs font-semibold text-rose-800">{error}</p>}
  {busy&&<p role="status" className="text-xs text-amber-800">No envíes el acta mientras se cargan fotografías.</p>}
 </div>;
}
