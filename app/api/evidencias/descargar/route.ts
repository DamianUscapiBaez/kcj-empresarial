import {NextResponse} from "next/server";
import {GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {currentUser} from "@/lib/auth";
import {rolesActivos} from "@/lib/permisos-kcj";
import {prisma} from "@/lib/prisma";
import {s3Config} from "@/lib/evidencias";
export const runtime="nodejs";
export async function GET(req:Request){const u=await currentUser();if(!u)return NextResponse.json({error:"No autorizado"},{status:401});const key=new URL(req.url).searchParams.get("key");if(!key)return NextResponse.json({error:"Falta key"},{status:400});const asset=await prisma.evidenceAsset.findUnique({where:{key}});if(!asset?.verifiedAt)return NextResponse.json({error:"No existe"},{status:404});const allowed:Record<string,string[]>={FLOTA:["ADMIN","OPERACIONES","JEFE_OPERACIONES","MANTENIMIENTO"],MANTENIMIENTO:["MANTENIMIENTO"],SSOMA:["SSOMA"],HOMOLOGACION:["HOMOLOGACION","OPERACIONES","JEFE_OPERACIONES","ADMIN"],RRHH:["RRHH"],CUSTODIA:["ADMIN","OPERACIONES","JEFE_OPERACIONES"],CONNECT:["OPERACIONES","JEFE_OPERACIONES","SSOMA"],AULA:["ADMIN","INSTRUCTOR","SSOMA","SALUD"]};if(asset.uploadedBy!==u.id&&!rolesActivos(u).some(r=>allowed[asset.purpose].includes(r)))return NextResponse.json({error:"Permiso denegado"},{status:403});const {bucket,client}=s3Config();const url=await getSignedUrl(client,new GetObjectCommand({Bucket:bucket,Key:key}),{expiresIn:60});return NextResponse.redirect(url,{status:302});}
