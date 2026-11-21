import QRCode from "qrcode";
import {notFound} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {KcjLogo} from "@/components/ui/KcjLogo";
export default async function Certificado({params}:{params:Promise<{codigo:string}>}){
 const {codigo}=await params;
 if(!/^KCJ-[A-F0-9]{24}$/.test(codigo))notFound();
 const enrollment=await prisma.enrollment.findUnique({where:{certificateCode:codigo},include:{course:true,worker:true}});
 if(!enrollment||!enrollment.approvedAt)notFound();
 const siteURL=process.env.NEXT_PUBLIC_SITE_URL??(process.env.VERCEL_URL?`https://${process.env.VERCEL_URL}`:"http://localhost:3000");
 const verifyUrl=`${siteURL}/certificado/${codigo}`;
 const qr=await QRCode.toDataURL(verifyUrl,{margin:2,width:180});
 const initials=enrollment.worker.name.split(/\s+/).map(p=>p[0]).join(".").slice(0,12);
 return <main className="min-h-screen bg-kcj-paper px-4 py-14 sm:py-20"><article className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-pane">
  <div className="border-b border-slate-100 bg-kcj-charcoal px-6 py-6 text-center text-white"><KcjLogo size="large"/><p className="mt-3 text-xs font-semibold uppercase tracking-[.16em] text-slate-300">KCJ PERÚ S.A.C.</p></div>
  <div className="space-y-5 px-6 py-7 text-center sm:px-9"><p className="kcj-eyebrow">Documento interno verificable</p><h1 className="text-2xl font-black tracking-tight text-kcj-charcoal">Verificación de constancia</h1>
   <div className="rounded-2xl bg-slate-50 px-5 py-4 text-left"><p className="text-xs uppercase tracking-wider text-slate-500">Código</p><p className="mt-1 break-all font-mono text-sm font-semibold text-kcj-charcoal">{codigo}</p></div>
   <dl className="space-y-3 text-left text-sm"><div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="text-slate-500">Curso</dt><dd className="text-right font-semibold text-slate-800">{enrollment.course.title}</dd></div><div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="text-slate-500">Participante (iniciales)</dt><dd className="font-semibold">{initials}</dd></div><div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="text-slate-500">Horas acreditadas</dt><dd className="font-semibold">{enrollment.course.hours} HHC</dd></div><div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="text-slate-500">Calificación</dt><dd className="font-semibold">{enrollment.score}%</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Fecha de aprobación</dt><dd className="font-semibold">{enrollment.approvedAt.toLocaleDateString("es-PE",{timeZone:"America/Lima"})}</dd></div></dl>
   <div className="flex justify-center pt-2"><img src={qr} width={180} height={180} alt="Código QR de verificación de constancia"/></div>
   <p className="text-xs leading-5 text-slate-500">Documento interno KCJ. No equivale a acreditación oficial de Minera Las Bambas.</p>
  </div>
  <div className="h-1.5 bg-kcj-red"/>
 </article></main>;
}
