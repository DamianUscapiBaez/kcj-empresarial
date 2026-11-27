import Link from 'next/link';
import {randomUUID} from 'node:crypto';
import {notFound} from 'next/navigation';
import {requireRole} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {InspeccionRutinaForm} from '@/components/dominio/InspeccionRutinaForm';
import {registrarInspeccionRutina} from '@/app/actions-vehiculos';
export default async function RutinaPage({params}:{params:Promise<{id:string}>}){
 const user=await requireRole('ADMIN','OPERACIONES','JEFE_OPERACIONES');const {id}=await params;
 const v=await prisma.vehicle.findUnique({where:{id},include:{equipment:true}});if(!v||!v.active)notFound();
 return <main className="space-y-4"><Link href={`/dashboard/ficha-vehicular/${id}#inspecciones`} className="text-kcj-red underline">Volver a ficha vehicular</Link><header className="card"><h1 className="text-xl font-black">Inspección integral de rutina · {v.plate} / {v.code}</h1><p>{v.type} · {v.make} {v.model}</p></header><InspeccionRutinaForm key={id} vehicleId={id} tipo={v.type} equipment={v.equipment.map(e=>({itemCode:e.itemCode,expectedQuantity:e.expectedQuantity,actualQuantity:e.actualQuantity,label:e.label}))} eventId={randomUUID()} inspector={user.displayName} action={registrarInspeccionRutina}/></main>;
}
