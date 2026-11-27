import {NextResponse} from "next/server";
import {GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {currentUser} from "@/lib/auth";
import {rolesSesion} from "@/lib/roles-sesion";
import {prisma} from "@/lib/prisma";
import {s3Config} from "@/lib/evidencias";
import {puedePracticar,esTema,PRACTICO_TECSUP} from "@/lib/simulacros-kcj";
export const runtime="nodejs";
export async function GET(req:Request){const u=await currentUser();if(!u)return NextResponse.json({error:"No autorizado"},{status:401});const key=new URL(req.url).searchParams.get("key");if(!key)return NextResponse.json({error:"Falta key"},{status:400});const asset=await prisma.evidenceAsset.findUnique({where:{key}});if(!asset?.verifiedAt)return NextResponse.json({error:"No existe"},{status:404});const allowed:Record<string,string[]>={FLOTA:["ADMIN","OPERACIONES","JEFE_OPERACIONES","MANTENIMIENTO"],MANTENIMIENTO:["MANTENIMIENTO"],SSOMA:["SSOMA"],HOMOLOGACION:["HOMOLOGACION","OPERACIONES","JEFE_OPERACIONES","ADMIN"],RRHH:["RRHH"],CUSTODIA:["ADMIN","OPERACIONES","JEFE_OPERACIONES"],CONNECT:["OPERACIONES","JEFE_OPERACIONES","SSOMA"],AULA:["ADMIN","INSTRUCTOR","SSOMA","SALUD"]};const effective=await rolesSesion(u);if(effective.includes("PROPIETARIO"))return NextResponse.json({error:"Usa los documentos de tu unidad"},{status:403});let permitted=asset.uploadedBy===u.id||effective.some(r=>allowed[asset.purpose]?.includes(r));
 if(!permitted&&asset.purpose==="AULA"&&u.workerId&&u.worker?.active){
  const material=await prisma.practiceMaterial.findFirst({where:{evidenceKey:key},select:{topicCode:true}});
  if(material?.topicCode===PRACTICO_TECSUP){permitted=(await rolesSesion(u)).includes("CONDUCTOR");}
  else if(material&&esTema(material.topicCode)&&puedePracticar((await rolesSesion(u)),material.topicCode)){
   const state=await prisma.practiceTopicState.findUnique({where:{code:material.topicCode}});
   permitted=Boolean(state?.published);
  }
 }
 if(!permitted)return NextResponse.json({error:"Permiso denegado"},{status:403});const {bucket,client}=s3Config();const url=await getSignedUrl(client,new GetObjectCommand({Bucket:bucket,Key:key}),{expiresIn:60});return NextResponse.redirect(url,{status:302,headers:{"Cache-Control":"private,no-store","X-Content-Type-Options":"nosniff"}});}
