import "server-only";
import {prisma} from "@/lib/prisma";
import {parseDayInLima,rosterSituation,pauseState,type Situation} from "@/lib/pausas-utils";

export type DailyPauseRow={
 workerId:string;document:string;name:string;situation:Situation;
 unitCode:string|null;plate:string|null;serviceCode:string|null;
 pauses:{id:string;createdAt:Date;status:string;startedAt:Date|null;dueAt:Date|null;completedAt:Date|null;plannedMinutes:number;missedReason:string|null;evidenceKey:string|null;unitCode:string|null;plate:string|null;serviceCode:string|null}[];
 state:string;
};
export async function dailyPauseReport(day:string):Promise<{day:string;rows:DailyPauseRow[];total:number;working:number;resting:number;withPauses:number;withoutPauses:number}>{
 const {start,end}=parseDayInLima(day);
 // Incluye conductores activos y a quienes constan en esa fecha en el ROSTER,
 // servicios o registros de pausa, incluso si después fueron dados de baja.
 const [rosterMatches,serviceMatches,pauseMatches]=await Promise.all([
  prisma.roster.findMany({where:{status:"PUBLICADO",startsAt:{lt:end},endsAt:{gt:start}},select:{workerId:true}}),
  prisma.service.findMany({where:{startsAt:{lt:end},endsAt:{gt:start},status:{not:"CANCELADO"},workerId:{not:null}},select:{workerId:true}}),
  prisma.activePause.findMany({where:{createdAt:{gte:start,lt:end}},select:{workerId:true}}),
 ]);
 const historicIds=[...new Set([...rosterMatches,...serviceMatches,...pauseMatches].map(x=>x.workerId).filter((id):id is string=>!!id))];
 const strongHistoricIds=new Set([...serviceMatches,...pauseMatches].map(x=>x.workerId).filter((id):id is string=>!!id));
 const workers=await prisma.worker.findMany({where:{OR:[
  {active:true,OR:[{job:{contains:"conductor",mode:"insensitive"}},{user:{is:{OR:[{role:"CONDUCTOR"},{grants:{some:{role:"CONDUCTOR",revokedAt:null}}}]}}}]},
  ...(historicIds.length?[{id:{in:historicIds}}]:[]),
 ]},select:{id:true,document:true,name:true,job:true,user:{select:{role:true,grants:{where:{revokedAt:null},select:{role:true}}}}},orderBy:{name:"asc"}});
 // Quienes tienen una guardia de otra función no deben agregarse por accidente.
 const drivers=workers.filter(w=>w.job.toLowerCase().includes("conductor")||w.user?.role==="CONDUCTOR"||w.user?.grants.some(g=>g.role==="CONDUCTOR")||strongHistoricIds.has(w.id));
 const ids=drivers.map(x=>x.id);
 if(!ids.length)return {day,rows:[],total:0,working:0,resting:0,withPauses:0,withoutPauses:0};
 const [rosters,services,pauses]=await Promise.all([
  prisma.roster.findMany({where:{workerId:{in:ids},status:"PUBLICADO",startsAt:{lt:end},endsAt:{gt:start}},select:{workerId:true,kind:true,startsAt:true,endsAt:true}}),
  prisma.service.findMany({where:{workerId:{in:ids},startsAt:{lt:end},endsAt:{gt:start},status:{not:"CANCELADO"}},include:{vehicle:{select:{code:true,plate:true}}},orderBy:{startsAt:"desc"}}),
  prisma.activePause.findMany({where:{workerId:{in:ids},createdAt:{gte:start,lt:end}},orderBy:{createdAt:"asc"},select:{id:true,workerId:true,createdAt:true,status:true,startedAt:true,dueAt:true,completedAt:true,plannedMinutes:true,missedReason:true,evidenceKey:true,unitCode:true,plate:true,serviceCode:true}}),
 ]);
 const rows=drivers.map(worker=>{
  const ownRoster=rosters.filter(r=>r.workerId===worker.id);
  const guard=ownRoster.filter(r=>r.kind==="GUARDIA");const rest=ownRoster.filter(r=>r.kind==="DESCANSO");
  const conflict=guard.some(g=>rest.some(r=>g.startsAt<r.endsAt&&r.startsAt<g.endsAt));
  const situation=rosterSituation(ownRoster.map(r=>r.kind),conflict);
  const own=pauses.filter(p=>p.workerId===worker.id);
  const svc=services.find(s=>s.workerId===worker.id);
  const latest=[...own].reverse().find(p=>!!p.serviceCode)??own[own.length-1];
  return {workerId:worker.id,document:worker.document,name:worker.name,situation,
   unitCode:latest?.unitCode??svc?.vehicle?.code??null,plate:latest?.plate??svc?.vehicle?.plate??null,serviceCode:latest?.serviceCode??svc?.code??null,
   pauses:own,state:pauseState(situation,own)} satisfies DailyPauseRow;
 });
 return {day,rows,total:rows.length,working:rows.filter(r=>["TRABAJANDO","TRABAJO_Y_DESCANSO"].includes(r.situation)).length,resting:rows.filter(r=>r.situation==="DESCANSANDO").length,withPauses:rows.filter(r=>r.pauses.some(p=>p.status==="FINALIZADA")).length,withoutPauses:rows.filter(r=>["TRABAJANDO","TRABAJO_Y_DESCANSO"].includes(r.situation)&&r.state==="SIN_REGISTRO").length};
}
