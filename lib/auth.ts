import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { tokenHash } from "@/lib/crypto";
import { trabajadorMinimoSesion } from "@/lib/auth-select";
import {panelActual} from "@/lib/panel-sesion";
import {rolesParaPanel} from "@/lib/paneles-kcj";
export const COOKIE="kcj_session";
export async function currentUser(){
 const raw=(await cookies()).get(COOKIE)?.value;
 if(!raw)return null;
 const session=await prisma.session.findUnique({where:{tokenHash:tokenHash(raw)},include:{user:{include:{worker:{select:trabajadorMinimoSesion},grants:{where:{revokedAt:null}}}}}});
 if(!session||session.revokedAt||session.expiresAt<new Date()||!session.user.active||(session.user.workerId&&!session.user.worker?.active))return null;
 return session.user;
}
export async function requireUser(){const user=await currentUser();if(!user)redirect("/login");return user;}
export async function requireRole(...roles:Role[]){
 const user=await requireUser();
 const panel=await panelActual(user);
 // La sesión puede ser única, pero los permisos NO se comparten entre trabajos.
 if(!panel||!roles.some(role=>rolesParaPanel(user,panel).includes(role)))throw new Error("No autorizado para esta operación desde el panel seleccionado");
 return user;
}
export function assertRole(role:Role,allowed:readonly Role[]):void {if(!allowed.includes(role))throw new Error("Permiso denegado");}
