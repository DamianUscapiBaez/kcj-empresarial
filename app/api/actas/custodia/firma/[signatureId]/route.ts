import {NextResponse} from "next/server";
import {GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {currentUser} from "@/lib/auth";
import {tieneRol} from "@/lib/permisos-kcj";
import {prisma} from "@/lib/prisma";
import {s3Config} from "@/lib/evidencias";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** La URL se obtiene por el ID de firma, nunca exponiendo claves S3 en el HTML. */
export async function GET(_req:Request,{params}:{params:Promise<{signatureId:string}>}){
 const user=await currentUser();
 if(!user)return NextResponse.json({error:"No autenticado"},{status:401});
 if(!tieneRol(user,"ADMIN","OPERACIONES","JEFE_OPERACIONES","MANTENIMIENTO","SSOMA"))return NextResponse.json({error:"Sin permiso"},{status:403});
 const {signatureId}=await params;
 const signature=await prisma.custodySignature.findUnique({where:{id:signatureId}});
 if(!signature)return NextResponse.json({error:"Firma no encontrada"},{status:404});
 const asset=await prisma.evidenceAsset.findUnique({where:{key:signature.evidenceKey}});
 if(!asset?.verifiedAt||asset.contentType!=="image/png")return NextResponse.json({error:"Firma no disponible"},{status:404});
 const {bucket,client}=s3Config();
 const signed=await getSignedUrl(client,new GetObjectCommand({Bucket:bucket,Key:asset.key,ResponseContentType:"image/png",ResponseContentDisposition:"inline"}),{expiresIn:60});
 return NextResponse.redirect(signed,{status:302,headers:{"Cache-Control":"private,no-store","X-Content-Type-Options":"nosniff"}});
}
