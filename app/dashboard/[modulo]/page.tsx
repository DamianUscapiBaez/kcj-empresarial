import {notFound} from "next/navigation";
import {requireUser} from "@/lib/auth";
import {modules,isModuleSlug,canAccess} from "@/lib/modulos";
import {ContenidoModulo} from "@/components/dominio/ContenidoModulo";
export default async function ModulePage({params}:{params:Promise<{modulo:string}>}){const {modulo}=await params;if(!isModuleSlug(modulo))notFound();const u=await requireUser();if(!canAccess(u.role,modulo))notFound();const meta=modules.find(m=>m.slug===modulo);return <><header><h1 className="text-2xl font-black text-navy">{meta?.title}</h1><p className="text-sm text-slate-500">{meta?.description} · Registros en PostgreSQL</p></header><ContenidoModulo modulo={modulo} user={u}/></>}
