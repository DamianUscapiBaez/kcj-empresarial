/**
 * Carga compatible del padrón de colaboradores durante despliegues con esquema
 * atrasado. Solo degrada en errores de Prisma por ausencia de tabla/columna.
 * Nunca convierte problemas de conexión o permisos en «sin registros».
 * No escribe ni cambia registros.
 */
export type ColaboradorListado = {
 id:string;
 document:string;
 name:string;
 area:string;
 secondaryArea:string|null;
 active:boolean;
 license:string|null;
 licenseExpires:Date|null;
};
export type AreaCatalogo = {name:string};
export type ColaboradorBase = Omit<ColaboradorListado,"secondaryArea">;

export type OrigenColaboradores = {
 listarVigentes:()=>Promise<ColaboradorListado[]>;
 listarBase:()=>Promise<ColaboradorBase[]>;
 listarAreas:()=>Promise<AreaCatalogo[]>;
};

type ResultadoColaboradores = {
 people:ColaboradorListado[];
 catalog:AreaCatalogo[];
 soloLectura:boolean;
 workerPendiente:boolean;
 catalogoPendiente:boolean;
};

/** P2021 = tabla inexistente, P2022 = columna inexistente. */
export function errorEstructuraPrisma(error:unknown):boolean {
 if(!error||typeof error!=="object"||!("code" in error))return false;
 const code=(error as {code?:unknown}).code;
 return code==="P2021"||code==="P2022";
}

export async function cargarColaboradoresCompat(origen:OrigenColaboradores):Promise<ResultadoColaboradores>{
 let workerPendiente=false;
 let catalogoPendiente=false;
 let people:ColaboradorListado[];
 try {
  people=await origen.listarVigentes();
 }catch(error:unknown){
  if(!errorEstructuraPrisma(error))throw error;
  // Solo lectura de columnas históricas: nunca se inventan segundas áreas.
  const base=await origen.listarBase();
  people=base.map(row=>({...row,secondaryArea:null}));
  workerPendiente=true;
 }
 let catalog:AreaCatalogo[];
 try{
  catalog=await origen.listarAreas();
 }catch(error:unknown){
  if(!errorEstructuraPrisma(error))throw error;
  catalog=[];
  catalogoPendiente=true;
 }
 return {people,catalog,soloLectura:workerPendiente||catalogoPendiente,workerPendiente,catalogoPendiente};
}
