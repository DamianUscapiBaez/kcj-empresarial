import {NextResponse} from "next/server";
import {GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {currentUser} from "@/lib/auth";
import {tieneRol} from "@/lib/permisos-kcj";
import {prisma} from "@/lib/prisma";
import {s3Config} from "@/lib/evidencias";
export const runtime="nodejs";
export async function GET(req:Request){
 const user=await currentUser();if(!user)return NextResponse.json({error:"Inicia sesión"},{status:401});
 if(!tieneRol(user,"ADMIN","GERENCIA","OPERACIONES","JEFE_OPERACIONES","SSOMA","SALUD","CONDUCTOR"))return NextResponse.json({error:"No autorizado"},{status:403});
 const id=new URL(req.url).searchParams.get("id");if(!id)return NextResponse.json({error:"Falta identificación"},{status:400});
 const pause=await prisma.activePause.findUnique({where:{id},select:{workerId:true,evidenceKey:true}});
 if(!pause?.evidenceKey)return NextResponse.json({error:"Evidencia no encontrada"},{status:404});
 const supervisor=tieneRol(user,"ADMIN","GERENCIA","OPERACIONES","JEFE_OPERACIONES","SSOMA","SALUD");
 if(!supervisor&&pause.workerId!==user.workerId)return NextResponse.json({error:"No autorizado"},{status:403});
 const asset=await prisma.evidenceAsset.findUnique({where:{key:pause.evidenceKey}});
 if(!asset?.verifiedAt||asset.purpose!=="CONNECT"||!asset.contentType.startsWith("image/"))return NextResponse.json({error:"Fotografía no verificada"},{status:404});
 try{const {bucket,client}=s3Config();const url=await getSignedUrl(client,new GetObjectCommand({Bucket:bucket,Key:asset.key}),{expiresIn:60});return NextResponse.redirect(url,{status:302,headers:{"Cache-Control":"no-store, private"}});}catch{return NextResponse.json({error:"Servicio de evidencia no disponible"},{status:503});}
}
