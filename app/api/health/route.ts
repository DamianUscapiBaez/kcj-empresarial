import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {TABLAS_KCJ,COLUMNAS_CRITICAS_KCJ} from "@/lib/esquema-requerido-kcj";

export const runtime="nodejs";
export const dynamic="force-dynamic";
/** Pública: incluye WorkArea y Worker.secondaryArea mediante el catálogo completo de tablas y columnas. Solo revela estado y cantidades, nunca datos personales. */
export async function GET(){
 const headers={"Cache-Control":"no-store"};
 try{
  await prisma.$queryRaw`SELECT 1`;
  const [tables,columns]=await Promise.all([
   prisma.$queryRaw<Array<{table_name:string}>>`SELECT table_name FROM information_schema.tables WHERE table_schema=current_schema() AND table_type='BASE TABLE'`,
   prisma.$queryRaw<Array<{table_name:string;column_name:string}>>`SELECT table_name,column_name FROM information_schema.columns WHERE table_schema=current_schema()`,
  ]);
  const present=new Set(tables.map(x=>x.table_name));
  const available=new Set(columns.map(x=>`${x.table_name}.${x.column_name}`));
  const missingTables=TABLAS_KCJ.filter(name=>!present.has(name));
  const missingColumns=COLUMNAS_CRITICAS_KCJ.filter(x=>!available.has(`${x.table}.${x.column}`));
  if(missingTables.length||missingColumns.length)return NextResponse.json({status:"error",database:"reachable",schema:"incomplete",code:"KCJ_SCHEMA_PENDING",missingCount:missingTables.length+missingColumns.length,time:new Date().toISOString()},{status:503,headers});
  return NextResponse.json({status:"ok",database:"reachable",schema:"present",note:"Estructura detectada; esto no sustituye pruebas funcionales de la marcha blanca",time:new Date().toISOString()},{headers});
 }catch{return NextResponse.json({status:"error",database:"unreachable_or_schema_invalid",code:"KCJ_DATABASE_ERROR"},{status:503,headers});}
}
