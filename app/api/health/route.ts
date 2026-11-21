import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** La conexión sola no basta: la UI depende también de tablas migradas. */
export async function GET(){
 const headers={"Cache-Control":"no-store"};
 try {
  await prisma.$queryRaw`SELECT 1`;
  const tables=await prisma.$queryRaw<Array<{table_name:string}>>`
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = current_schema()
    AND table_name IN ('User','Worker','Vehicle','Service','Course','SafetyCase')`;
  const present=new Set(tables.map(x=>x.table_name));
  const required=["User","Worker","Vehicle","Service","Course","SafetyCase"];
  const missing=required.filter(name=>!present.has(name));
  if(missing.length)return NextResponse.json({status:"error",database:"reachable",schema:"incomplete",code:"KCJ_SCHEMA_PENDING",missingCount:missing.length,time:new Date().toISOString()},{status:503,headers});
  return NextResponse.json({status:"ok",database:"reachable",schema:"ready",time:new Date().toISOString()},{headers});
 }catch{
  return NextResponse.json({status:"error",database:"unreachable_or_schema_invalid",code:"KCJ_DATABASE_ERROR"},{status:503,headers});
 }
}
