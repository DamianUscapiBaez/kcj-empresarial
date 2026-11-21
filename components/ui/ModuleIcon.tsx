import type { ReactNode } from "react";
import type { ModuleSlug } from "@/lib/modulos";

type IconName = "dashboard" | "users" | "calendar" | "clock" | "bus" | "shield" | "wrench" | "folder" | "book" | "medical" | "chart" | "bell" | "package" | "key" | "truck" | "clipboard" | "check" | "arrow" | "logout" | "menu" | "external";
const paths:Record<IconName,ReactNode>={
 dashboard:<><rect x="3" y="3" width="7" height="7" rx="1.3"/><rect x="14" y="3" width="7" height="7" rx="1.3"/><rect x="3" y="14" width="7" height="7" rx="1.3"/><rect x="14" y="14" width="7" height="7" rx="1.3"/></>,
 users:<><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 11a3 3 0 1 0-1.4-5.7M18 14c2.2.4 3 2 3 4v2"/></>,
 calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 15h2M14 15h2"/></>,
 clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
 bus:<><rect x="4" y="3" width="16" height="16" rx="3"/><path d="M4 12h16M8 19v2M16 19v2M8 8h2M14 8h2"/></>,
 shield:<><path d="m12 2 8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6zM8 12l3 3 5-6"/></>,
 wrench:<><path d="M15 5a5 5 0 0 0-6 6L3 17a2 2 0 1 0 4 4l6-6a5 5 0 0 0 6-6l-3 3-4-1-1-4z"/></>,
 folder:<><path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>,
 book:<><path d="M12 5a9 9 0 0 0-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4a9 9 0 0 0-9 1zM12 5v15"/></>,
 medical:<><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 7v10M7 12h10"/></>,
 chart:<><path d="M4 20V4M4 20h17M8 16v-4M13 16V7M18 16v-7"/></>,
 bell:<><path d="M6 17h12l-2-3V9a4 4 0 0 0-8 0v5zM10 20a2 2 0 0 0 4 0"/></>,
 package:<><path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10M7.5 4.5l9 5"/></>,
 key:<><circle cx="8" cy="14" r="4"/><path d="m11 11 9-9 2 2-3 3 2 2-2 2-2-2-4 4"/></>,
 truck:<><path d="M3 6h11v11H3zM14 10h4l3 4v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
 clipboard:<><rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4v-2h6v2M9 12h6M9 16h6"/></>,
 check:<><path d="M4 12l5 5L20 6"/></>,
 arrow:<><path d="M4 12h16m-7-7 7 7-7 7"/></>,
 logout:<><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5M14 7l5 5-5 5M19 12H8"/></>,
 menu:<><path d="M4 6h16M4 12h16M4 18h16"/></>,
 external:<><path d="M13 4h7v7M20 4l-10 10M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/></>,
};
export function UIIcon({name,size=20,className=""}:{name:IconName;size?:number;className?:string}){
 return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
export const moduleIcon:Record<ModuleSlug,IconName>={
 acceso:"key", personal:"users", operaciones:"truck", roster:"calendar", connect:"bus", flota:"bus", mantenimiento:"wrench", ssoma:"shield", homologacion:"clipboard", tareo:"clock", aula:"book", rrhh:"users", salud:"medical", propietarios:"folder", comunicaciones:"bell", reportes:"chart", custodia:"clipboard", almacen:"package",
};
