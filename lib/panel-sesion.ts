import "server-only";
import {cookies} from "next/headers";
import {panelesDisponibles,puedeSeleccionarPanel,type PanelKCJ} from "@/lib/paneles-kcj";
import type {Role} from "@prisma/client";

export const COOKIE_PANEL="kcj_panel_activo";
type Cuenta={role:Role;grants?:{role:Role;revokedAt?:Date|null}[]};

/** Toda lectura vuelve a comprobar los roles actualmente autorizados. */
export async function panelActual(user:Cuenta):Promise<PanelKCJ|null>{
 const disponibles=panelesDisponibles(user);
 if(disponibles.length===1)return disponibles[0];
 const elegido=(await cookies()).get(COOKIE_PANEL)?.value??"";
 return puedeSeleccionarPanel(user,elegido)?elegido:null;
}
