import {z} from "zod";
export function field(form:FormData,name:string,min=1,max=300):string {return z.string().trim().min(min).max(max).parse(form.get(name));}
export function optionalField(form:FormData,name:string,max=500):string|null {const v=String(form.get(name)??"").trim();return v?z.string().max(max).parse(v):null;}
export function instant(form:FormData,name:string):Date {const raw=field(form,name,5,80);const formatted=/^\d{4}-\d{2}-\d{2}$/.test(raw)?`${raw}T${/(expires|validUntil|endsAt)/i.test(name)?"23:59:59":"00:00:00"}-05:00`: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)?`${raw}:00-05:00`:raw;const dt=new Date(formatted);if(Number.isNaN(dt.getTime()))throw new Error(`Fecha no válida: ${name}`);return dt;}
export function flag(form:FormData,name:string):boolean {return form.get(name)==="on"||form.get(name)==="true";}
export function numberField(form:FormData,name:string,min=0,max=1000000):number {const n=Number(field(form,name));return z.number().finite().min(min).max(max).parse(n);}
export function optionalDate(form:FormData,name:string):Date|null {return form.get(name)?instant(form,name):null;}
