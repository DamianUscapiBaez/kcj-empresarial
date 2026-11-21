import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { tokenHash } from "@/lib/crypto";
export const COOKIE="kcj_session";
export async function currentUser(){
 const raw=(await cookies()).get(COOKIE)?.value;
 if(!raw)return null;
 const session=await prisma.session.findUnique({where:{tokenHash:tokenHash(raw)},include:{user:{include:{worker:true}}}});
 if(!session||session.revokedAt||session.expiresAt<new Date()||!session.user.active)return null;
 return session.user;
}
export async function requireUser(){const user=await currentUser();if(!user)redirect("/login");if(user.mustChangePassword)redirect("/cambiar-clave");return user;}
export async function requireRole(...roles:Role[]){const user=await requireUser();if(!roles.includes(user.role))throw new Error("No autorizado para esta operación");return user;}
export function assertRole(role:Role,allowed:readonly Role[]):void {if(!allowed.includes(role))throw new Error("Permiso denegado");}
