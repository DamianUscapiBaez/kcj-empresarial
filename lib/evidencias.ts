import "server-only";
import {S3Client} from "@aws-sdk/client-s3";
import {prisma} from "@/lib/prisma";
export function s3Config(){const bucket=process.env.KCJ_S3_BUCKET,region=process.env.KCJ_S3_REGION,accessKeyId=process.env.KCJ_S3_ACCESS_KEY_ID,secretAccessKey=process.env.KCJ_S3_SECRET_ACCESS_KEY;if(!bucket||!region||!accessKeyId||!secretAccessKey)throw new Error("Almacenamiento privado de evidencias no configurado");return {bucket,client:new S3Client({region,endpoint:process.env.KCJ_S3_ENDPOINT||undefined,forcePathStyle:Boolean(process.env.KCJ_S3_ENDPOINT),credentials:{accessKeyId,secretAccessKey}})};}
export async function requireEvidence(key:string,purpose?:string|string[]):Promise<void>{const a=await prisma.evidenceAsset.findUnique({where:{key}});if(!a||!a.verifiedAt)throw new Error("El archivo de evidencia no existe o todavía no se ha confirmado su carga");if(purpose&&!([purpose].flat().includes(a.purpose)))throw new Error("Esta evidencia no corresponde al área del proceso");}

/** La evidencia de una operación nueva debe haber sido subida por su responsable autenticado. */
export async function requireEvidenceOwned(key:string,purpose:string,actorId:string):Promise<void>{
 const asset=await prisma.evidenceAsset.findUnique({where:{key},select:{purpose:true,verifiedAt:true,uploadedBy:true}});
 if(!asset?.verifiedAt||asset.purpose!==purpose||asset.uploadedBy!==actorId)throw new Error("La evidencia no está confirmada o no pertenece a esta sesión y proceso");
}

/** Reportes nuevos solo pueden adjuntar archivos del actor que los está registrando. */
export async function requireEvidenceOwnedAny(key:string,purposes:readonly string[],actorId:string):Promise<void>{
 const asset=await prisma.evidenceAsset.findUnique({where:{key},select:{purpose:true,verifiedAt:true,uploadedBy:true}});
 if(!asset?.verifiedAt||asset.uploadedBy!==actorId||!purposes.includes(asset.purpose))throw new Error("La evidencia no está confirmada o no pertenece al responsable y proceso");
}
