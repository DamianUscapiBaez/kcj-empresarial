import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {z} from "zod";
import {currentUser} from "@/lib/auth";
import {rolesActivos} from "@/lib/permisos-kcj";
import {prisma} from "@/lib/prisma";
import {s3Config} from "@/lib/evidencias";
export const runtime="nodejs";
const schema=z.object({filename:z.string().min(1).max(200),mime:z.enum(["image/jpeg","image/png","image/webp","application/pdf"]),bytes:z.number().int().positive().max(10*1024*1024),purpose:z.enum(["FLOTA","MANTENIMIENTO","SSOMA","HOMOLOGACION","RRHH","CUSTODIA","CONNECT","AULA"])});
export async function POST(req:Request){try{const u=await currentUser();if(!u)return NextResponse.json({error:"No autorizado"},{status:401});const v=schema.parse(await req.json());const allowed:Record<string,string[]>={FLOTA:["ADMIN","OPERACIONES","JEFE_OPERACIONES","MANTENIMIENTO"],MANTENIMIENTO:["MANTENIMIENTO"],SSOMA:["SSOMA"],HOMOLOGACION:["HOMOLOGACION","ADMIN","OPERACIONES","JEFE_OPERACIONES"],RRHH:["RRHH"],CUSTODIA:["ADMIN","OPERACIONES","JEFE_OPERACIONES"],CONNECT:["CONDUCTOR","OPERACIONES","JEFE_OPERACIONES"],AULA:["ADMIN","INSTRUCTOR","SSOMA","SALUD"]};if(!rolesActivos(u).some(r=>allowed[v.purpose].includes(r)))return NextResponse.json({error:"Sin permiso para esta categoría de evidencia"},{status:403});const {bucket,client}=s3Config();const key=`kcj/${new Date().getFullYear()}/${u.id}/${randomUUID()}`;await prisma.evidenceAsset.create({data:{key,uploadedBy:u.id,filename:v.filename,contentType:v.mime,expectedBytes:v.bytes,purpose:v.purpose}});const url=await getSignedUrl(client,new PutObjectCommand({Bucket:bucket,Key:key,ContentType:v.mime,IfNoneMatch:"*"}),{expiresIn:300});return NextResponse.json({key,url,expiresIn:300,uploadHeaders:{"If-None-Match":"*"}});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Error de carga"},{status:400});}}
