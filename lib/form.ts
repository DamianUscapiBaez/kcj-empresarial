import {fechaHoraPeru} from "@/lib/fechas-kcj";
import {z} from "zod";
export function field(form:FormData,name:string,min=1,max=300):string {return z.string().trim().min(min).max(max).parse(form.get(name));}
export function optionalField(form:FormData,name:string,max=500):string|null {const v=String(form.get(name)??"").trim();return v?z.string().max(max).parse(v):null;}
export function instant(form:FormData,name:string):Date {return fechaHoraPeru(field(form,name,5,80),name);}
export function flag(form:FormData,name:string):boolean {return form.get(name)==="on"||form.get(name)==="true";}
export function numberField(form:FormData,name:string,min=0,max=1000000):number {const n=Number(field(form,name));return z.number().finite().min(min).max(max).parse(n);}
export function optionalDate(form:FormData,name:string):Date|null {return form.get(name)?instant(form,name):null;}
