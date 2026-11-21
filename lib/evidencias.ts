import "server-only";
import {S3Client} from "@aws-sdk/client-s3";
import {prisma} from "@/lib/prisma";
export function s3Config(){const bucket=process.env.KCJ_S3_BUCKET,region=process.env.KCJ_S3_REGION,accessKeyId=process.env.KCJ_S3_ACCESS_KEY_ID,secretAccessKey=process.env.KCJ_S3_SECRET_ACCESS_KEY;if(!bucket||!region||!accessKeyId||!secretAccessKey)throw new Error("Almacenamiento privado de evidencias no configurado");return {bucket,client:new S3Client({region,endpoint:process.env.KCJ_S3_ENDPOINT||undefined,forcePathStyle:Boolean(process.env.KCJ_S3_ENDPOINT),credentials:{accessKeyId,secretAccessKey}})};}
export async function requireEvidence(key:string,purpose?:string|string[]):Promise<void>{const a=await prisma.evidenceAsset.findUnique({where:{key}});if(!a||!a.verifiedAt)throw new Error("El archivo de evidencia no existe o todavía no se ha confirmado su carga");if(purpose&&!([purpose].flat().includes(a.purpose)))throw new Error("Esta evidencia no corresponde al área del proceso");}
