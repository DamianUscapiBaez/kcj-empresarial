import {NextResponse} from 'next/server';
import {GetObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {currentUser} from '@/lib/auth';
import {rolesSesion} from '@/lib/roles-sesion';
import {prisma} from '@/lib/prisma';
import {s3Config} from '@/lib/evidencias';
import {DOCUMENTOS_VEHICULARES_GENERALES,REQUISITOS_MINEROS_VEHICULARES} from '@/lib/requisitos-mineros-kcj';
export const runtime='nodejs';
// No recibe una clave de almacenamiento; resuelve el documento por ID y propietario en el servidor.
export async function GET(req:Request){
 const u=await currentUser();if(!u||!u.ownerId||!(await rolesSesion(u)).includes('PROPIETARIO'))return NextResponse.json({error:'No autorizado'},{status:403});
 const p=new URL(req.url).searchParams,id=p.get('id'),tipo=p.get('tipo');if(!id)return NextResponse.json({error:'Documento no encontrado'},{status:404});
 const scope={vehicle:{ownerId:u.ownerId}};
 const doc=tipo==='general'?await prisma.vehicleDocument.findFirst({where:{id,...scope,verifiedAt:{not:null},kind:{in:DOCUMENTOS_VEHICULARES_GENERALES.map(x=>x.value)}},select:{evidenceKey:true}}):tipo==='minero'?await prisma.vehicleMiningDocument.findFirst({where:{id,...scope,externalStatus:'APROBADO',kind:{in:REQUISITOS_MINEROS_VEHICULARES.map(x=>x.code)}},select:{evidenceKey:true}}):tipo==='pase'?await prisma.clearance.findFirst({where:{id,...scope,workerId:null,kind:'TARJETA_AMARILLA',verified:true},select:{evidenceKey:true}}):null;
 if(!doc?.evidenceKey)return NextResponse.json({error:'Documento no encontrado o no verificado'},{status:404});
 const asset=await prisma.evidenceAsset.findUnique({where:{key:doc.evidenceKey},select:{key:true,verifiedAt:true,purpose:true,contentType:true}});
 if(!asset?.verifiedAt||!['FLOTA','HOMOLOGACION'].includes(asset.purpose)||asset.contentType!=='application/pdf')return NextResponse.json({error:'PDF no disponible'},{status:404});
 await prisma.auditLog.create({data:{userId:u.id,entity:'VehicleDocument',entityId:id,action:'CONSULTA_PDF_PROVEEDOR',payload:{tipo,ownerId:u.ownerId}}});
 const {bucket,client}=s3Config();const url=await getSignedUrl(client,new GetObjectCommand({Bucket:bucket,Key:asset.key,ResponseContentType:'application/pdf',ResponseContentDisposition:p.get('descargar')==='1'?'attachment':'inline'}),{expiresIn:60});
 return NextResponse.redirect(url,{status:302,headers:{'Cache-Control':'private,no-store'}});
}
