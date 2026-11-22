/** Prueba real de esquema y relaciones de cuentas en PostgreSQL de ensayo.
 * No usa datos reales y siempre revierte la transacción.
 * NO prueba el navegador ni las Server Actions autenticadas; sí revisa persistencia
 * y vínculos básicos trabajador -> cuenta -> permiso adicional -> sesión.
 */
import "dotenv/config";
import {randomUUID} from "node:crypto";
import {PrismaClient,Prisma} from "@prisma/client";
import {passwordHash,passwordMatches} from "../lib/crypto";
const prisma=new PrismaClient();
class RollbackVerificado extends Error{}
async function main():Promise<void>{
 if(process.env.KCJ_INTEGRATION_TEST_DB!=="1")throw new Error("Debe confirmar KCJ_INTEGRATION_TEST_DB=1 solo en un entorno de ensayo.");
 const raw=process.env.DATABASE_URL;
 if(!raw)throw new Error("DATABASE_URL de ensayo no configurada.");
 const dbName=decodeURIComponent(new URL(raw).pathname).split("/").filter(Boolean).at(-1)??"";
 if(!/(test|ensayo|staging|qa)/i.test(dbName))throw new Error("Seguridad: el nombre de la base debe identificar inequívocamente un entorno de prueba.");
 let ok=false;
 try{
  await prisma.$transaction(async tx=>{
   const suffix=randomUUID().replaceAll("-","").slice(0,12);
   const password="KCJ_Ensayo_Solo_Prueba_2026!";
   const worker=await tx.worker.create({data:{document:`TEST${suffix}`,name:"Trabajador ficticio de ensayo",job:"Conductor",area:"Operaciones",secondaryArea:null,active:true}});
   const user=await tx.user.create({data:{login:`test_${suffix}`,displayName:"Cuenta ficticia de ensayo",passwordHash:passwordHash(password),role:"OPERACIONES",workerId:worker.id,active:true}});
   await tx.userRoleGrant.create({data:{userId:user.id,role:"CONDUCTOR",grantedBy:user.id}});
   const recorded=await tx.user.findUniqueOrThrow({where:{id:user.id},include:{worker:{select:{id:true,active:true}},grants:{where:{revokedAt:null}}}});
   if(recorded.worker?.id!==worker.id||!recorded.worker.active||!passwordMatches(password,recorded.passwordHash)||recorded.grants.length!==1||recorded.grants[0].role!=="CONDUCTOR")throw new Error("Cuenta, contraseña, vínculo o función adicional incorrectos.");
   if(await tx.user.count({where:{workerId:worker.id}})!==1)throw new Error("La ficha tiene más de una cuenta vinculada.");
   const session=await tx.session.create({data:{userId:user.id,tokenHash:randomUUID(),expiresAt:new Date(Date.now()+3600000)}});
   await tx.session.update({where:{id:session.id},data:{revokedAt:new Date()}});
   if(!(await tx.session.findUniqueOrThrow({where:{id:session.id}})).revokedAt)throw new Error("La sesión no se revocó.");
   ok=true;
   throw new RollbackVerificado();
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:20000});
 }catch(error){if(!(error instanceof RollbackVerificado))throw error;}
 if(!ok)throw new Error("Prueba de cuentas no completada.");
 console.log("CUENTAS DE ENSAYO OK: ficha única, cuenta, contraseña, función CONDUCTOR adicional y sesión. Transacción revertida sin registros de prueba.");
}
main().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1;}).finally(()=>prisma.$disconnect());
