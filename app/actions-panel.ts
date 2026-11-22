"use server";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {requireUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {COOKIE_PANEL} from "@/lib/panel-sesion";
import {destinoPanel,puedeSeleccionarPanel} from "@/lib/paneles-kcj";

/** Reutiliza la sesión y la ficha existentes, sin crear cuentas duplicadas. */
export async function seleccionarPanel(form:FormData){
 const user=await requireUser();
 const panel=String(form.get("panel")??"");
 if(!puedeSeleccionarPanel(user,panel))throw new Error("Panel no autorizado");
 await prisma.auditLog.create({data:{userId:user.id,entity:"Session",entityId:user.id,action:"SELECCION_PANEL",payload:{panel}}});
 (await cookies()).set(COOKIE_PANEL,panel,{
  httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:8*60*60,
 });
 redirect(destinoPanel(panel));
}
