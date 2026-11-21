import "dotenv/config";
import {PrismaClient} from "@prisma/client";
import {readFileSync} from "node:fs";
import path from "node:path";

const prisma=new PrismaClient();
async function main(){
 const schema=readFileSync(path.join(process.cwd(),"prisma/schema.prisma"),"utf8");
 const names=Array.from(schema.matchAll(/^model\s+([A-Za-z][A-Za-z0-9]*)\s*\{/gm),m=>m[1]);
 const [where,rows]=await Promise.all([
  prisma.$queryRaw<Array<{database:string;schema:string}>>`SELECT current_database() as database, current_schema() as schema`,
  prisma.$queryRaw<Array<{table_name:string}>>`SELECT table_name FROM information_schema.tables WHERE table_schema=current_schema() AND table_type='BASE TABLE'`,
 ]);
 const present=new Set(rows.map(r=>r.table_name));
 const missing=names.filter(x=>!present.has(x));
 if(missing.length)throw new Error(`Faltan ${missing.length} tablas en PostgreSQL: ${missing.join(", ")}. Debe ejecutar prisma migrate deploy en ESTA base.`);
 const admins=await prisma.user.count({where:{role:"ADMIN",active:true}});
 const counts=await Promise.all([prisma.user.count(),prisma.worker.count(),prisma.vehicle.count(),prisma.service.count(),prisma.course.count(),prisma.safetyCase.count(),prisma.auditLog.count()]);
 console.log(JSON.stringify({status:admins?"ok":"sin-administrador",database:where[0]?.database,schema:where[0]?.schema,expectedTables:names.length,foundTables:rows.length,adminAccounts:admins,counts:{users:counts[0],workers:counts[1],vehicles:counts[2],services:counts[3],courses:counts[4],safetyCases:counts[5],audit:counts[6]}},null,2));
 if(!admins)throw new Error("Falta una cuenta ADMIN activa: ejecute db:seed con los secretos configurados. No borre tablas.");
}
main().catch(e=>{console.error(e instanceof Error?e.message:e);process.exitCode=1}).finally(()=>prisma.$disconnect());
