"use client";
import {useState} from "react";
interface PresignResult {key?:string;url?:string;error?:string}
export function EvidenceUploader({name,required,purpose,photoCapture=false}:{name:string;required?:boolean;purpose:"FLOTA"|"MANTENIMIENTO"|"SSOMA"|"HOMOLOGACION"|"RRHH"|"CUSTODIA"|"CONNECT"|"AULA";photoCapture?:boolean}){
 const [key,setKey]=useState("");const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function upload(file:File|null){if(!file)return;setBusy(true);setMessage("");setKey("");try{
  if(file.size>10*1024*1024)throw new Error("Archivo demasiado grande. Máximo 10 MB.");
  const r=await fetch("/api/evidencias/presign",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:file.name,mime:file.type,bytes:file.size,purpose})});const data:PresignResult=await r.json();if(!r.ok||!data.url||!data.key)throw new Error(data.error??"Error preparando carga");
  const put=await fetch(data.url,{method:"PUT",headers:{"Content-Type":file.type},body:file});if(!put.ok)throw new Error("No se pudo subir el archivo");
  const check=await fetch("/api/evidencias/confirmar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:data.key})});if(!check.ok)throw new Error("No se pudo confirmar la evidencia");setKey(data.key);setMessage("Archivo privado cargado y verificado.");
 }catch(e){setMessage(e instanceof Error?e.message:"Error de carga");}finally{setBusy(false);}}
 const chooser=(label:string,accept:string,capture=false)=>
  <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-kcj-border bg-white px-4 py-2.5 text-sm font-semibold text-kcj-charcoal hover:border-kcj-red hover:bg-kcj-redSoft sm:w-auto">
   <span>{label}</span>
   <input className="sr-only" aria-label={label} type="file" accept={accept} {...(capture?{capture:"environment" as const}:{})} onChange={e=>void upload(e.target.files?.[0]??null)}/>
  </label>;
 return <div className="space-y-2">
  <div className="flex flex-wrap gap-2">{photoCapture?<>{chooser("Tomar foto", "image/*", true)}{chooser("Subir foto desde galería", "image/jpeg,image/png,image/webp")}</>:chooser("Seleccionar PDF o imagen", ".pdf,image/png,image/jpeg,image/webp")}</div>
  <input type="hidden" name={name} value={key}/>
  <p aria-live="polite" role="status" className={`break-words text-xs leading-5 ${key?"text-green-800":message?"text-amber-800":"text-slate-600"}`}>{busy?"Subiendo y verificando archivo…":message||(required?"Adjunta un archivo antes de registrar. Formatos PDF, JPG, PNG o WebP, máximo 10 MB.":"Adjunto opcional. Formatos PDF, JPG, PNG o WebP, máximo 10 MB.")}</p>
  {required&&!key&&<p className="text-xs text-slate-600">La operación no será aceptada por el servidor sin evidencia cargada y confirmada.</p>}
 </div>;
}
