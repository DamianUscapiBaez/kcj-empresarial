import "dotenv/config";
import {PrismaClient} from "@prisma/client";
import {scryptSync,timingSafeEqual} from "node:crypto";

const prisma=new PrismaClient();
function verifyPassword(value:string,hash:string):boolean{
 const parts=hash.split(":");
 if(parts.length!==3||parts[0]!=="scrypt"||! /^[a-f0-9]{32}$/.test(parts[1])||! /^[a-f0-9]{128}$/.test(parts[2]))return false;
 const actual=scryptSync(value,parts[1],64),expected=Buffer.from(parts[2],"hex");
 return timingSafeEqual(actual,expected);
}
async function main():Promise<void>{
 const login=process.env.KCJ_ADMIN_DOCUMENT?.trim();
 const password=process.env.KCJ_ADMIN_PASSWORD;
 if(!login||!password)throw new Error("Configure KCJ_ADMIN_DOCUMENT y KCJ_ADMIN_PASSWORD como secretos para comprobar la cuenta inicial.");
 const admin=await prisma.user.findUnique({where:{login},select:{id:true,active:true,role:true,passwordHash:true,mustChangePassword:true,lockedUntil:true}});
 if(!admin)throw new Error("La cuenta inicial no existe en esta base. Verifique migraciones, seed y DATABASE_URL.");
 if(!admin.active||admin.role!=="ADMIN")throw new Error("La cuenta existe, pero no está activa con rol ADMIN.");
 if(admin.lockedUntil&&admin.lockedUntil>new Date())throw new Error("La cuenta está temporalmente bloqueada por intentos fallidos.");
 if(!verifyPassword(password,admin.passwordHash))throw new Error("La clave del secreto no coincide con esta cuenta. Si ya la cambiaron, eso es normal: verifique login en navegador con la nueva clave.");
 console.log(JSON.stringify({status:"ok",initialLoginVerified:true,role:admin.role,mustChangePassword:admin.mustChangePassword},null,2));
}
main().catch(e=>{console.error(e instanceof Error?e.message:e);process.exitCode=1}).finally(()=>prisma.$disconnect());
