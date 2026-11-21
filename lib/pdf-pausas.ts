import "server-only";
import {readFile} from "node:fs/promises";
import {join} from "node:path";
import type {DailyPauseRow} from "@/lib/consulta-pausas";
import {localDateTime,durationMinutes} from "@/lib/pausas-utils";

/** PDF A4 vertical, generado en Node sin dependencias de terceros. Una sola ficha
 *  consolidada; si hay muchos conductores, continúa en páginas numeradas. */
const A4_W=595.28, A4_H=841.89, L=31, RIGHT=A4_W-31;
const cells=[20,99,48,48,64,63,89,30,72];
const headers=["#","CONDUCTOR","UNIDAD","PLACA","SERVICIO","ROSTER","FECHA / HORA","MIN","ESTADO / MOTIVO"];
const xCenters=cells.map((w,i)=>L+cells.slice(0,i).reduce((a,b)=>a+b,0)+w/2);
const breakText=(value:string,max:number):string[]=>{
 const clean=value.replace(/\s+/g," ").trim();if(!clean)return ["-"];
 const words=clean.split(" ");const lines:string[]=[];let current="";
 for(const word of words){const parts=word.match(new RegExp(`.{1,${Math.max(3,max)}}`,"g"))??[word];for(const p of parts){if(current&&current.length+p.length+1>max){lines.push(current);current="";}current=current?`${current} ${p}`:p;}}
 if(current)lines.push(current);return lines;
};
const safe=(value:string)=>Buffer.from(value.replace(/[\u2013\u2014]/g,"-").replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"').replace(/[^\u0020-\u007E\u00A0-\u00FF]/g,"?"),"latin1").toString("latin1").replaceAll("\\","\\\\").replaceAll("(","\\(").replaceAll(")","\\)");
const drawText=(x:number,y:number,value:string,size=7,bold=false,color="0.15 0.20 0.25")=>`${color} rg BT /${bold?"F2":"F1"} ${size} Tf 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm (${safe(value)}) Tj ET\n`;
const rect=(x:number,y:number,w:number,h:number,color:string)=>`${color} rg ${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f\n`;
const textLines=(x:number,top:number,lines:string[],size=6.2)=>lines.map((line,i)=>drawText(x,top-i*9,line,size)).join("");
const pdfStream=(data:Buffer|string)=>{const body=Buffer.isBuffer(data)?data:Buffer.from(data,"latin1");return Buffer.concat([Buffer.from(`<< /Length ${body.length} >>\nstream\n`),body,Buffer.from("\nendstream")]);};
function assemblePdf(pages:string[],logo:Buffer,dimensions:{w:number;h:number}){
 const objects:Buffer[]=[Buffer.alloc(0)];const add=(b:Buffer|string)=>{objects.push(typeof b==="string"?Buffer.from(b,"latin1"):b);return objects.length-1;};
 const catalog=add(""),pagesIdx=add("");
 const font=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
 const fontBold=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
 const logoId=add(Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${dimensions.w} /Height ${dimensions.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.length} >>\nstream\n`),logo,Buffer.from("\nendstream")]));
 const pageIds=pages.map(content=>{const stream=add(pdfStream(content));return add(`<< /Type /Page /Parent ${pagesIdx} 0 R /MediaBox [0 0 ${A4_W} ${A4_H}] /Resources << /Font << /F1 ${font} 0 R /F2 ${fontBold} 0 R >> /XObject << /Logo ${logoId} 0 R >> >> /Contents ${stream} 0 R >>`);});
 objects[catalog]=Buffer.from(`<< /Type /Catalog /Pages ${pagesIdx} 0 R >>`);
 objects[pagesIdx]=Buffer.from(`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id=>`${id} 0 R`).join(" ")}] >>`);
 const chunks:Buffer[]=[Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n","latin1")];const offsets=[0];let position=chunks[0].length;
 objects.slice(1).forEach((object,i)=>{const chunk=Buffer.concat([Buffer.from(`${i+1} 0 obj\n`),object,Buffer.from("\nendobj\n")]);offsets.push(position);chunks.push(chunk);position+=chunk.length;});
 const xrefStart=position;const lines=[`xref\n0 ${objects.length}\n0000000000 65535 f \n`,...offsets.slice(1).map(o=>`${String(o).padStart(10,"0")} 00000 n \n`),`trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`];chunks.push(Buffer.from(lines.join(""),"latin1"));return Buffer.concat(chunks);
}

type Report={day:string;rows:DailyPauseRow[];total:number;working:number;resting:number;withPauses:number;withoutPauses:number};
export async function generateDailyPausePdf(report:Report,author:string):Promise<Buffer>{
 const logo=await readFile(join(process.cwd(),"public","assets","kcj-logo-original.jpg"));
 const pageContents:string[]=[];let commands="",y=0,rowsOnPage=0;
 const generated=localDateTime(new Date());
 const pageBegin=()=>{
  commands="";rowsOnPage=0;
  commands+=rect(0,A4_H-5,A4_W,5,"0.65 0.10 0.19");
  commands+=`q 120 0 0 53 ${L} ${A4_H-78} cm /Logo Do Q\n`;
  commands+=drawText(396,A4_H-42,"KCJ PERÚ S.A.C.",10,true);
  commands+=drawText(396,A4_H-59,"LÍNEA DE MANDO",8,true);
  commands+=rect(L,A4_H-90,RIGHT-L,2,"0.65 0.10 0.19");
  commands+=drawText(L,A4_H-113,"CONTROL MAESTRO DIARIO DE PAUSAS ACTIVAS",11,true);
  commands+=drawText(L,A4_H-129,"Ficha única - todos los conductores de la fecha consultada",7.2);
  commands+=drawText(L,A4_H-154,`FECHA DEL CONTROL: ${report.day}   |   GUARDIAS: todas   |   REGISTROS: ${report.total}`,7.5,true);
  commands+=drawText(L,A4_H-171,`Trabajando: ${report.working}   Descansando: ${report.resting}   Con pausas finalizadas: ${report.withPauses}   Sin registro: ${report.withoutPauses}`,7.2);
  commands+=rect(L,A4_H-204,RIGHT-L,21,"0.15 0.20 0.25");
  let x=L;headers.forEach((h,i)=>{commands+=drawText(x+2,A4_H-196,h,5.9,true,"1 1 1");x+=cells[i];});
  y=A4_H-204;
 };
 const finishPage=()=>{
  commands+=rect(L,53,RIGHT-L,0.7,"0.78 0.81 0.84");
  commands+=drawText(L,40,`Generado: ${generated}   |   Responsable: ${author.slice(0,58)}`,6.3);
  commands+=drawText(L,26,`Documento de auditoría interna - Evidencias fotográficas vinculadas a cada registro.`,6.0);
  pageContents.push(commands);
 };
 pageBegin();
 let idx=0;
 for(const worker of report.rows){
  const events=worker.pauses.length?worker.pauses:[null];
  for(const ev of events){
   idx++;
   const when=ev?.startedAt?localDateTime(ev.startedAt):report.day;
   const eventTime=ev?.startedAt?`${when}${ev.completedAt?` / fin ${localDateTime(ev.completedAt)}`:ev.dueAt?` / previsto ${localDateTime(ev.dueAt)}`:""}`:ev?.status==="NO_REALIZADA"?`Aviso ${localDateTime(ev.createdAt)}`:report.day;
   const mins=ev?.completedAt?durationMinutes(ev.startedAt,ev.completedAt)?.toString()??"-":ev?.status==="EN_CURSO"?"En curso":"-";
   const status=worker.situation==="DESCANSANDO"&&!ev?"Descanso - no aplica":ev?.status==="NO_REALIZADA"?`No realizada: ${ev.missedReason??"Sin motivo"}`:ev?.status==="FINALIZADA"?"Finalizada (foto)":ev?.status==="EN_CURSO"?"En curso":"Sin registro";
   const values=[String(idx),`${worker.name} / Doc: ${worker.document}`,ev?.unitCode??worker.unitCode??"-",ev?.plate??worker.plate??"-",ev?.serviceCode??worker.serviceCode??"-",worker.situation.replaceAll("_"," "),eventTime,mins,status];
   if(ev)values[8]+= ` / ID: ${ev.id.slice(0,10)}`;
   const wrapped=values.map((v,i)=>breakText(v,Math.max(4,Math.floor((cells[i]-4)/(i===1?3.7:3.2)))));
   const height=Math.max(32,...wrapped.map(lines=>lines.length*9+12));
   if(y-height<68){finishPage();pageBegin();}
   commands+=rect(L,y-height,RIGHT-L,height,rowsOnPage%2?"1 1 1":"0.95 0.96 0.97");
   let x=L;wrapped.forEach((lines,i)=>{commands+=textLines(x+2,y-12,lines,5.95);x+=cells[i];});
   commands+=rect(L,y-height,RIGHT-L,0.45,"0.82 0.84 0.86");
   y-=height;rowsOnPage++;
  }
 }
 if(!idx){commands+=drawText(L+14,y-29,"No se encontraron conductores para esta fecha.",8);}
 finishPage();
 const count=pageContents.length;
 const numbered=pageContents.map((str,i)=>str+drawText(RIGHT-78,40,`Página ${i+1} de ${count}`,6.2));
 return assemblePdf(numbered,logo,{w:1559,h:688});
}
