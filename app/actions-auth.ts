"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { passwordMatches, passwordHash, token, tokenHash } from "@/lib/crypto";
import { COOKIE, requireUser } from "@/lib/auth";
import { z } from "zod";
const credentials=z.object({login:z.string().trim().min(4).max(32),password:z.string().min(1).max(256)});
export async function login(form:FormData){
 const params=credentials.safeParse({login:form.get("login"),password:form.get("password")});
 if(!params.success)redirect("/login?error=datos");
 const u=await prisma.user.findUnique({where:{login:params.data.login}});
 const now=new Date();
 if(!u||!u.active||u.lockedUntil&&u.lockedUntil>now||!passwordMatches(params.data.password,u.passwordHash)){
   if(u&&u.active){const attempts=u.failedLogins+1;await prisma.user.update({where:{id:u.id},data:{failedLogins:attempts,lockedUntil:attempts>=5?new Date(Date.now()+15*60000):null}});}
   redirect("/login?error=credenciales");
 }
 await prisma.user.update({where:{id:u.id},data:{failedLogins:0,lockedUntil:null}});
 const secret=token();await prisma.session.create({data:{userId:u.id,tokenHash:tokenHash(secret),expiresAt:new Date(Date.now()+8*60*60*1000)}});
 (await cookies()).set(COOKIE,secret,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:8*60*60});
 redirect("/dashboard");
}
export async function logout(){const raw=(await cookies()).get(COOKIE)?.value;if(raw)await prisma.session.updateMany({where:{tokenHash:tokenHash(raw)},data:{revokedAt:new Date()}});(await cookies()).delete(COOKIE);redirect("/login");}
export async function changePassword(form:FormData){
 const user=await (async()=>{const {currentUser}=await import("@/lib/auth");return currentUser()})();
 if(!user)redirect("/login");
 const prev=String(form.get("actual")??"");const next=String(form.get("nueva")??"");const confirm=String(form.get("confirmar")??"");
 if(!passwordMatches(prev,user.passwordHash)||next.length<16||next.length>256||next!==confirm||next===prev)redirect("/cambiar-clave?error=1");
 await prisma.$transaction(async tx=>{await tx.user.update({where:{id:user.id},data:{passwordHash:passwordHash(next),mustChangePassword:false,failedLogins:0}});await tx.auditLog.create({data:{userId:user.id,entity:"User",entityId:user.id,action:"CAMBIO_CLAVE"}});const raw=(await cookies()).get(COOKIE)?.value;if(raw)await tx.session.updateMany({where:{userId:user.id,tokenHash:{not:tokenHash(raw)}},data:{revokedAt:new Date()}});});
 redirect("/dashboard");
}
export async function requireAccountActive(){return requireUser();}
