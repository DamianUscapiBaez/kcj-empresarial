import {NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Diagnóstico técnico protegido; nunca exponer claves ni filas de trabajadores. */
export async function GET(){
 const user=await currentUser();
 if(!user)return NextResponse.json({error:"Autenticación requerida"},{status:401,headers:{"Cache-Control":"no-store"}});
 if(user.role!=="ADMIN")return NextResponse.json({error:"Permiso denegado"},{status:403,headers:{"Cache-Control":"no-store"}});
 const checks=[
  {name:"Personal",run:()=>prisma.worker.count()},
  {name:"Flota",run:()=>prisma.vehicle.count()},
  {name:"Servicios",run:()=>prisma.service.count()},
  {name:"SSOMA",run:()=>prisma.safetyCase.count()},
  {name:"Aula Virtual",run:()=>prisma.course.count()},
  {name:"ROSTER",run:()=>prisma.roster.count()},
  {name:"Tareo",run:()=>prisma.timesheet.count()},
  {name:"Inventario",run:()=>prisma.inventoryItem.count()},
 ];
 const results=await Promise.allSettled(checks.map(check=>check.run()));
 const modules=checks.map((check,i)=>{
  const result=results[i];
  return {module:check.name,status:result.status==="fulfilled"?"ok":"error",count:result.status==="fulfilled"?result.value:null};
 });
 const failed=modules.some(check=>check.status==="error");
 return NextResponse.json({status:failed?"error":"ok",modules,checkedAt:new Date().toISOString()},{status:failed?503:200,headers:{"Cache-Control":"no-store"}});
}
