import Image from "next/image";

/** Activo corporativo original. Mantener proporción; nunca recortar ni alterar el logo. */
export function KcjLogo({size="normal",className=""}:{size?:"normal"|"large";className?:string}){
 return <span className={`inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 ring-1 ring-black/5 ${className}`}>
  <Image src="/assets/kcj-logo-original.jpg" alt="KCJ Perú S.A.C. — logotipo oficial" width={size==="large"?210:158} height={size==="large"?92:69} priority className={`${size==="large"?"h-[72px] w-[166px]":"h-[50px] w-[116px]"} object-contain`} />
 </span>;
}
