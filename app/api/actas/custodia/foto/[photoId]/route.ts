import {NextResponse} from "next/server";
import {GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {currentUser} from "@/lib/auth";
import {tieneRol} from "@/lib/permisos-kcj";
import {prisma} from "@/lib/prisma";
import {s3Config} from "@/lib/evidencias";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const mimePermitidos=new Set(["image/jpeg","image/png","image/webp"]);
/** Fotos privadas por ID. Nunca devolver las claves S3 en HTML o datos públicos. */
export async function GET(_req:Request,{params}:{params:Promise<{photoId:string}>}){
 const user=await currentUser();
 if(!user)return NextResponse.json({error:"No autenticado"},{status:401});
 if(!tieneRol(user,"ADMIN","OPERACIONES","JEFE_OPERACIONES","MANTENIMIENTO","SSOMA"))return NextResponse.json({error:"Sin permiso"},{status:403});
 const {photoId}=await params;
 const photo=await prisma.custodyItemPhoto.findUnique({where:{id:photoId},select:{evidenceKey:true}});
 if(!photo)return NextResponse.json({error:"Foto no encontrada"},{status:404});
 const asset=await prisma.evidenceAsset.findUnique({where:{key:photo.evidenceKey}});
 if(!asset?.verifiedAt||asset.purpose!=="CUSTODIA"||!mimePermitidos.has(asset.contentType))return NextResponse.json({error:"Foto no disponible"},{status:404});
 const {bucket,client}=s3Config();
 const url=await getSignedUrl(client,new GetObjectCommand({Bucket:bucket,Key:asset.key,ResponseContentType:asset.contentType,ResponseContentDisposition:"inline"}),{expiresIn:60});
 return NextResponse.redirect(url,{status:302,headers:{"Cache-Control":"private,no-store","X-Content-Type-Options":"nosniff"}});
}
