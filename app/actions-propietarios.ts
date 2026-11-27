"use server";
import {randomBytes} from "node:crypto";
import {revalidatePath} from "next/cache";
import {prisma} from "@/lib/prisma";
import {requireRole} from "@/lib/auth";
import {passwordHash} from "@/lib/crypto";
import {loginPropietario} from "@/lib/propietarios-kcj";
import {Prisma} from "@prisma/client";

/** Contraseña temporal de alta: nunca se guarda en texto claro ni en auditoría. */
export type EstadoAccesoPropietario={ok:boolean;message:string;login:string;temporaryPassword:string};
const fallo=(message:string):EstadoAccesoPropietario=>({ok:false,message,login:"",temporaryPassword:""});
async function accesoSeguro(_prev:EstadoAccesoPropietario,form:FormData,modo:"CREAR"|"RESTABLECER"):Promise<EstadoAccesoPropietario>{
 const actor=await requireRole("ADMIN");
 try {
  const ownerId=String(form.get("ownerId")??"").trim();
  if(!ownerId)throw new Error("Selecciona un propietario válido.");
  const temporal=randomBytes(24).toString("base64url");
  const resultado=await prisma.$transaction(async tx=>{
   const owner=await tx.owner.findUnique({where:{id:ownerId},select:{id:true,document:true,name:true,contact:true}});
   if(!owner)throw new Error("El propietario ya no existe.");
   // Bloqueo por la misma fila para evitar altas paralelas de la misma ficha.
   await tx.owner.update({where:{id:ownerId},data:{contact:owner.contact}});
   const vinculadas=await tx.user.findMany({where:{ownerId},select:{id:true,login:true,role:true,active:true,workerId:true}});
   const worker=/^\d{8}$/.test(owner.document.trim())?await tx.worker.findUnique({where:{document:owner.document.trim()},select:{id:true,name:true,active:true,user:{select:{id:true,login:true,active:true,ownerId:true}}}}):null;
   if(vinculadas.length>1)throw new Error("La ficha tiene varias cuentas existentes. TI debe conciliarlas antes de continuar.");
   if(modo==="CREAR"){
    if(vinculadas.length)throw new Error("El propietario ya tiene cuenta. No se creará una segunda. Si tiene también cuenta laboral, TI debe conciliar ambas sin borrar historial.");
    if(worker){
     if(!worker.active||!worker.user?.active)throw new Error("Existe ficha laboral con ese DNI. Revisa primero la cuenta del colaborador; no se creará otra.");
     if(form.get("confirmIdentity")!=="on")throw new Error("Confirma que el DNI y la titularidad corresponden al mismo colaborador: "+worker.name);
     if(worker.user.ownerId&&worker.user.ownerId!==ownerId)throw new Error("La cuenta ya está vinculada a otro proveedor. Requiere revisión de TI.");
     await tx.user.update({where:{id:worker.user.id},data:{ownerId}});
     await tx.userRoleGrant.upsert({where:{userId_role:{userId:worker.user.id,role:"PROPIETARIO"}},create:{userId:worker.user.id,role:"PROPIETARIO",grantedBy:actor.id},update:{revokedAt:null,grantedAt:new Date(),grantedBy:actor.id}});
     await tx.auditLog.create({data:{userId:actor.id,entity:"User",entityId:worker.user.id,action:"VINCULAR_ACCESO_PROVEEDOR",payload:{ownerId,workerId:worker.id}}});
     return {login:worker.user.login,linked:true};
    }
    const login=loginPropietario(owner.document);
    if(await tx.user.findUnique({where:{login},select:{id:true}}))throw new Error("El usuario derivado del documento ya está utilizado. Revisa con el administrador antes de continuar.");
    const nueva=await tx.user.create({data:{ownerId,workerId:null,login,displayName:owner.name,role:"PROPIETARIO",passwordHash:passwordHash(temporal),mustChangePassword:true}});
    await tx.auditLog.create({data:{userId:actor.id,entity:"User",entityId:nueva.id,action:"CREAR_ACCESO_PROPIETARIO",payload:{ownerId}}});
    return {login,linked:false};
   }
   const cuenta=vinculadas[0];
   if(!cuenta||cuenta.role!=="PROPIETARIO"||!cuenta.active)throw new Error("Solo se puede restablecer una cuenta de propietario activa. Si está desactivada, el administrador debe revisar su estado.");
   await tx.user.update({where:{id:cuenta.id},data:{passwordHash:passwordHash(temporal),mustChangePassword:true,failedLogins:0,lockedUntil:null}});
   await tx.session.updateMany({where:{userId:cuenta.id,revokedAt:null},data:{revokedAt:new Date()}});
   await tx.auditLog.create({data:{userId:actor.id,entity:"User",entityId:cuenta.id,action:"RESTABLECER_ACCESO_PROPIETARIO",payload:{ownerId,sesionesRevocadas:true}}});
   return {login:cuenta.login,linked:false};
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  revalidatePath("/dashboard/propietarios");
  return {ok:true,message:resultado.linked?"Perfil de proveedor vinculado a la cuenta laboral existente. Conserva su contraseña.":modo==="CREAR"?"Cuenta creada. Entrega la clave temporal únicamente al propietario.":"Clave restablecida. Se cerraron las sesiones anteriores.",login:resultado.login,temporaryPassword:resultado.linked?"":temporal};
 } catch(error){return fallo(error instanceof Error?error.message:"No se completó la operación. Revisa el estado del servidor.");}
}
export async function crearAccesoPropietario(estado:EstadoAccesoPropietario,form:FormData){return accesoSeguro(estado,form,"CREAR");}
export async function restablecerAccesoPropietario(estado:EstadoAccesoPropietario,form:FormData){return accesoSeguro(estado,form,"RESTABLECER");}
