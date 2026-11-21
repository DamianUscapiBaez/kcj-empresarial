import {NextResponse} from "next/server";
import {currentUser} from "@/lib/auth";
import {tieneRol} from "@/lib/permisos-kcj";
import {dailyPauseReport} from "@/lib/consulta-pausas";
import {parseDayInLima,todayInLima} from "@/lib/pausas-utils";
import {generateDailyPausePdf} from "@/lib/pdf-pausas";
import {prisma} from "@/lib/prisma";
export const runtime="nodejs";
export async function GET(req:Request){
 const user=await currentUser();if(!user)return NextResponse.json({error:"Inicia sesión"},{status:401});
 if(!tieneRol(user,"ADMIN","GERENCIA","OPERACIONES","JEFE_OPERACIONES","SSOMA","SALUD"))return NextResponse.json({error:"No autorizado"},{status:403});
 const date=new URL(req.url).searchParams.get("fecha")??todayInLima();
 try{parseDayInLima(date);}catch{return NextResponse.json({error:"Fecha inválida"},{status:400});}
 try{
  const report=await dailyPauseReport(date);
  if(report.rows.length>2500)return NextResponse.json({error:"El reporte supera el límite seguro. Consulta a TI"},{status:413});
  const pdf=await generateDailyPausePdf(report,user.displayName);
  await prisma.auditLog.create({data:{userId:user.id,entity:"ActivePause",entityId:date,action:"EXPORTAR_PDF",payload:{date,workers:report.total,pages:"auto"}}});
  return new NextResponse(new Uint8Array(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="KCJ_Pausas_Activas_${date}.pdf"`,"Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff"}});
 }catch(e){console.error("Error PDF pausas activas",e);return NextResponse.json({error:"No se pudo generar el reporte. Revisa las migraciones y almacenamiento"},{status:500});}
}
