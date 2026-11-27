import Link from 'next/link';
import {requireRole} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {mesPeru,mesActualPeru,coincideDia} from '@/lib/calendario-roster';
export default async function CalendarioRoster({searchParams}:{searchParams:Promise<{mes?:string}>}){
 await requireRole('ADMIN','OPERACIONES','JEFE_OPERACIONES','RRHH');
 const q=await searchParams;let mes=q.mes??mesActualPeru();let limites;try{limites=mesPeru(mes)}catch{mes=mesActualPeru();limites=mesPeru(mes);}
 const {inicio,fin,dias}=limites;
 const registros=await prisma.roster.findMany({where:{startsAt:{lt:fin},endsAt:{gt:inicio}},include:{worker:{select:{name:true,id:true}}},orderBy:{startsAt:'asc'}});
 const personal=await prisma.worker.findMany({where:{OR:[{active:true},{id:{in:[...new Set(registros.map(r=>r.workerId))]}}]},select:{id:true,name:true},orderBy:{name:'asc'}});
 const porPersona=new Map<string,typeof registros>();for(const r of registros){const a=porPersona.get(r.workerId)??[];a.push(r);porPersona.set(r.workerId,a);}
 return <section className="card space-y-4"><Link className="btn-secondary" href="/dashboard/roster">Volver al ROSTER</Link><h1 className="text-xl font-bold">Calendario mensual de ROSTER</h1><form className="flex flex-wrap items-end gap-2"><label>Mes<input type="month" name="mes" defaultValue={mes} className="input" required/></label><button className="btn">Consultar</button></form><p className="text-sm">Vista de consulta de registros existentes. G: guardia; D: descanso; B: borrador. No distingue aún día/noche ni vacaciones.</p><div className="overflow-x-auto"><table className="min-w-max border-collapse text-xs"><thead><tr><th className="sticky left-0 bg-white border p-2 text-left">Colaborador</th>{Array.from({length:dias},(_,i)=><th key={i} className="border p-2">{i+1}</th>)}</tr></thead><tbody>{personal.map(w=><tr key={w.id}><th className="sticky left-0 bg-white border p-2 text-left whitespace-nowrap">{w.name}</th>{Array.from({length:dias},(_,i)=>{const rs=(porPersona.get(w.id)??[]).filter(r=>coincideDia(r.startsAt,r.endsAt,inicio,i+1));return <td key={i} className="border p-2 text-center" title={rs.map(r=>`${r.kind} ${r.status}`).join('; ')}>{rs.map(r=>`${r.kind==='GUARDIA'?'G':'D'}${r.status==='BORRADOR'?' B':''}`).join(' / ')||'—'}</td>})}</tr>)}</tbody></table></div></section>;
}
