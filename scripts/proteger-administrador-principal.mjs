#!/usr/bin/env node
/** Activación controlada con identidad doble; no se expone por API o UI y no reasigna una cuenta ya fijada. */
import "dotenv/config";
import {PrismaClient, Prisma} from "@prisma/client";
const db=new PrismaClient();
const PRIMARY="PRIMARY";
const diagnose=process.argv.includes("--diagnostico");
const activate=process.argv.includes("--activar");
if(diagnose===activate){console.error("Uso: node scripts/proteger-administrador-principal.mjs --diagnostico | --activar");process.exit(2);}
try{
 const record=await db.primaryAdminProtection.findUnique({where:{id:PRIMARY},include:{user:{select:{id:true,role:true,active:true}}}});
 if(diagnose){console.log(JSON.stringify({proteccion:record?"ACTIVA":"PENDIENTE",usuarioAdminActivo:Boolean(record?.user?.active&&record?.user?.role==="ADMIN")}));process.exit(0);}
 const id=process.env.KCJ_PRIMARY_ADMIN_USER_ID?.trim();
 const login=process.env.KCJ_PRIMARY_ADMIN_LOGIN?.trim();
 const confirmation=process.env.KCJ_PRIMARY_ADMIN_CONFIRM?.trim();
 if(!id||!login||confirmation!=="SI_CONFIRMADO_POR_TITULAR")throw new Error("Se requiere ID, login exacto y confirmación expresa del titular. No compartir credenciales por chat.");
 await db.$transaction(async tx=>{
  const target=await tx.user.findUnique({where:{id},select:{id:true,login:true,role:true,active:true}});
  if(!target||target.login!==login||target.role!=="ADMIN"||!target.active)throw new Error("La cuenta no coincide con el ID y login autorizados, o no es ADMIN activo.");
  const current=await tx.primaryAdminProtection.findUnique({where:{id:PRIMARY},select:{userId:true}});
  if(current){if(current.userId!==id)throw new Error("Ya existe una cuenta principal distinta. Se requiere recuperación formal: operación detenida.");return;}
  await tx.primaryAdminProtection.create({data:{id:PRIMARY,userId:id}});
  await tx.auditLog.create({data:{userId:id,entity:"PrimaryAdminProtection",entityId:id,action:"ACTIVACION_ADMIN_PRINCIPAL",payload:{metodo:"TI_autorizado",cuentaConfirmada:true}}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 console.log(JSON.stringify({proteccion:"ACTIVA",cuentaConfirmada:true,nota:"No se publica la identidad ni secretos del titular"}));
}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=1;}finally{await db.$disconnect();}
