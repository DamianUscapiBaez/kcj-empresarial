"use client";
import {useState} from "react";
interface PresignResult {key?:string;url?:string;error?:string}
export function EvidenceUploader({name,required,purpose}:{name:string;required?:boolean;purpose:"FLOTA"|"MANTENIMIENTO"|"SSOMA"|"HOMOLOGACION"|"RRHH"|"CUSTODIA"|"CONNECT"}){
 const [key,setKey]=useState("");const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function upload(file:File|null){if(!file)return;setBusy(true);setMessage("");setKey("");try{
  if(file.size>10*1024*1024)throw new Error("Archivo demasiado grande. Máximo 10 MB.");
  const r=await fetch("/api/evidencias/presign",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:file.name,mime:file.type,bytes:file.size,purpose})});const data:PresignResult=await r.json();if(!r.ok||!data.url||!data.key)throw new Error(data.error??"Error preparando carga");
  const put=await fetch(data.url,{method:"PUT",headers:{"Content-Type":file.type},body:file});if(!put.ok)throw new Error("No se pudo subir el archivo");
  const check=await fetch("/api/evidencias/confirmar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:data.key})});if(!check.ok)throw new Error("No se pudo confirmar la evidencia");setKey(data.key);setMessage("Archivo privado cargado y verificado.");
 }catch(e){setMessage(e instanceof Error?e.message:"Error de carga");}finally{setBusy(false);}}
 return <div className="space-y-2"><input type="file" accept=".pdf,image/png,image/jpeg,image/webp" onChange={e=>void upload(e.target.files?.[0]??null)} className="input"/><input type="hidden" name={name} value={key} required={required}/><p role="status" className={`text-xs ${key?"text-green-700":"text-amber-700"}`}>{busy?"Subiendo archivo...":message||"Se requiere un almacenamiento privado S3 configurado."}</p></div>;
}
