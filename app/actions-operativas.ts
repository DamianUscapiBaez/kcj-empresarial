"use server";
import {requireEvidence,requireEvidenceOwnedAny} from "@/lib/evidencias";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {requireRole,requireUser} from "@/lib/auth";
import {tieneRol} from "@/lib/permisos-kcj";
import {field,optionalField,optionalDate,numberField,instant,flag} from "@/lib/form";
import {validInterval,overlaps,hoursBetween,mayCloseSafetyCase} from "@/lib/dominio-kcj";
import {comprobarAsignacion} from "@/lib/operaciones";
import {passwordHash,passwordMatches} from "@/lib/crypto";
import {validarClaveAsignada,validarRestablecimientoAdmin} from "@/lib/politica-contrasenas";
import {validarTipoUnidadKCJ} from "@/lib/tipos-unidad";
import {validarUnidadMedidaKCJ} from "@/lib/unidades-medida";
import {severidadSSOMA,deltaInventario,rolAltaColaborador,validarAltaConAcceso,enteroOperativo} from "@/lib/validaciones-prepiloto";
import {validarAreasTrabajo,nombreNuevaArea} from "@/lib/areas-trabajo";
import {tieneAreaConductor,validarRolConductorEnFicha} from "@/lib/acceso-conductor-laboral";
import {validarOrigenTareo,validarVinculoServicioTareo,motivoRegistroInterno} from "@/lib/tareo-kcj";
import {Prisma,type Role} from "@prisma/client";
import {panelActual} from "@/lib/panel-sesion";
import {autorizarOperacionServicio} from "@/lib/validaciones-prepiloto";
import {esRolKCJ,validarCambioRolPrincipal,validarBajaAdministrativa,validarVinculosRol,validacionReactivacion,motivoAdmin} from "@/lib/superadmin-policy";
const change=()=>revalidatePath("/dashboard", "layout");
async function log(userId:string,entity:string,entityId:string,action:string,payload?:object){await prisma.auditLog.create({data:{userId,entity,entityId,action,payload}});}
/** Personal: una sola ficha laboral; una segunda área es opcional. Los permisos se asignan aparte. */
export async function crearTrabajador(form:FormData){
 const u=await requireRole("ADMIN","RRHH");
 const document=field(form,"document",6,16),name=field(form,"name",3,150);
 const license=optionalField(form,"license"),licenseExpires=optionalDate(form,"licenseExpires");
 // ADMIN puede crear trabajador y acceso en una sola transacción: nunca queda una cuenta huérfana.
 const crearAcceso=flag(form,"crearAcceso");
 validarAltaConAcceso(crearAcceso,u.role==="ADMIN");
 const cuenta=crearAcceso?{
  login:field(form,"login",6,32),
  role:rolAltaColaborador(field(form,"role",3,30)) as Role,
  password:validarClaveAsignada(field(form,"password",16,256),field(form,"confirmPassword",16,256)),
 }:null;
 await prisma.$transaction(async tx=>{
  const catalog=await tx.workArea.findMany({where:{active:true},select:{name:true}});
  const areas=validarAreasTrabajo(field(form,"area",2,100),optionalField(form,"secondaryArea"),catalog.map(x=>x.name));
  if(cuenta)validarRolConductorEnFicha(cuenta.role,areas);
  // "job" se conserva únicamente para compatibilidad histórica; no es un área ni concede permisos.
  const p=await tx.worker.create({data:{document,name,job:"Sin especificar",...areas,license,licenseExpires}});
  await tx.auditLog.create({data:{userId:u.id,entity:"Worker",entityId:p.id,action:"REGISTRAR_COLABORADOR",payload:{areaPrincipal:areas.area,areaSecundaria:areas.secondaryArea}}});
  if(cuenta){
   if(await tx.user.findUnique({where:{login:cuenta.login},select:{id:true}}))throw new Error("El usuario ya existe. Ningún registro fue guardado; elija un identificador distinto.");
   const nuevo=await tx.user.create({data:{workerId:p.id,login:cuenta.login,displayName:name,role:cuenta.role,passwordHash:passwordHash(cuenta.password),mustChangePassword:false}});
   if(tieneAreaConductor(areas)&&cuenta.role!=="CONDUCTOR"){
    await tx.userRoleGrant.create({data:{userId:nuevo.id,role:"CONDUCTOR",grantedBy:u.id}});
   }
   await tx.auditLog.create({data:{userId:u.id,entity:"User",entityId:nuevo.id,action:"ALTA_INTEGRADA_CUENTA",payload:{workerId:p.id,role:cuenta.role,accesoConductor:tieneAreaConductor(areas)}}});
  }
 },{isolationLevel:"Serializable"});
 change();
 redirect(cuenta?"/dashboard/personal?registro=cuenta":"/dashboard/personal?registro=ficha");
}
/** Centro de Control configura los nombres de las áreas sin crear nuevos roles del sistema. */
export async function crearAreaTrabajo(form:FormData){
 const u=await requireRole("ADMIN");
 const name=nombreNuevaArea(field(form,"name",3,100));
 await prisma.$transaction(async tx=>{
  const existing=await tx.workArea.findMany({select:{name:true}});
  if(existing.some(x=>x.name.toLocaleLowerCase("es-PE")===name.toLocaleLowerCase("es-PE")))throw new Error("Ya existe un área de trabajo con ese nombre.");
  await tx.workArea.create({data:{name}});
  await tx.auditLog.create({data:{userId:u.id,entity:"WorkArea",entityId:name,action:"CREAR_AREA_TRABAJO",payload:{name}}});
 });change();
}

export async function crearCuenta(form:FormData){
 const actor=await requireRole("ADMIN");
 const role=field(form,"role") as Role;
 if(!esRolKCJ(role))throw new Error("Rol inválido");
 const password=validarClaveAsignada(field(form,"password",16,256),field(form,"confirmPassword",16,256));
 const workerId=optionalField(form,"workerId");const ownerId=optionalField(form,"ownerId");
 validarVinculosRol(role,workerId,ownerId);
 const login=field(form,"login",6,32),displayName=field(form,"displayName",3,120);
 await prisma.$transaction(async tx=>{
  if(await tx.user.findUnique({where:{login},select:{id:true}}))throw new Error("Ese usuario ya está registrado. Busca la cuenta existente en lugar de duplicarla.");
  if(workerId){
   const worker=await tx.worker.findUnique({where:{id:workerId},select:{active:true,area:true,secondaryArea:true,user:{select:{id:true}}}});
   if(!worker)throw new Error("La ficha laboral seleccionada no existe.");
   if(!worker.active)throw new Error("No se puede crear acceso para una ficha laboral inactiva.");
   if(worker.user)throw new Error("El colaborador ya tiene una cuenta. Usa la gestión de funciones adicionales o restablecimiento de contraseña.");
   validarRolConductorEnFicha(role,worker);
  }
  if(ownerId&&!await tx.owner.findUnique({where:{id:ownerId},select:{id:true}}))throw new Error("El propietario seleccionado no existe.");
  const a=await tx.user.create({data:{login,displayName,role,passwordHash:passwordHash(password),workerId,ownerId,mustChangePassword:false}});
  if(workerId&&role!=="CONDUCTOR"){
   const ficha=await tx.worker.findUniqueOrThrow({where:{id:workerId},select:{area:true,secondaryArea:true}});
   if(tieneAreaConductor(ficha))await tx.userRoleGrant.create({data:{userId:a.id,role:"CONDUCTOR",grantedBy:actor.id}});
  }
  await tx.auditLog.create({data:{userId:actor.id,entity:"User",entityId:a.id,action:"CREAR_CUENTA_CLAVE_ASIGNADA"}});
 });change();
}
/** ADMIN establece una nueva clave para otra cuenta; no ve ni recupera la anterior. */
export async function restablecerContrasena(form:FormData){
 const actor=await requireRole("ADMIN");
 if(!passwordMatches(field(form,"adminPassword",1,256),actor.passwordHash))throw new Error("La contraseña actual de ADMIN no coincide. No se efectuó ningún cambio.");
 const userId=field(form,"userId");
 const nueva=validarClaveAsignada(field(form,"password",16,256),field(form,"confirmPassword",16,256));
 await prisma.$transaction(async tx=>{
  const target=await tx.user.findUnique({where:{id:userId},select:{id:true,active:true}});
  if(!target)throw new Error("Cuenta de usuario no encontrada.");
  validarRestablecimientoAdmin(actor.id,target.id,target.active);
  await tx.user.update({where:{id:userId},data:{passwordHash:passwordHash(nueva),mustChangePassword:false,failedLogins:0,lockedUntil:null}});
  // La contraseña anterior no debe permitir usar sesiones ya iniciadas.
  await tx.session.updateMany({where:{userId},data:{revokedAt:new Date()}});
  await tx.auditLog.create({data:{userId:actor.id,entity:"User",entityId:userId,action:"ADMIN_REESTABLECE_CLAVE",payload:{sesionesRevocadas:true}}});
 });
 change();
 redirect("/dashboard/acceso?clave=actualizada");
}
/** ADMIN: modificar identificación de una cuenta sin alterar su contraseña ni vínculos. */
export async function editarCuentaAdmin(form:FormData){
 const actor=await requireRole("ADMIN");
 if(!passwordMatches(field(form,"adminPassword",1,256),actor.passwordHash))throw new Error("Confirma tu contraseña de ADMIN");
 const id=field(form,"userId"),login=field(form,"login",6,32),displayName=field(form,"displayName",3,120),reason=motivoAdmin(field(form,"reason",10,500));
 await prisma.$transaction(async tx=>{
  const old=await tx.user.findUniqueOrThrow({where:{id},select:{id:true,login:true,displayName:true}});
  if(old.login===login&&old.displayName===displayName)throw new Error("No se ha cambiado ningún dato de la cuenta");
  await tx.user.update({where:{id},data:{login,displayName}});
  if(old.login!==login)await tx.session.updateMany({where:{userId:id},data:{revokedAt:new Date()}});
  await tx.auditLog.create({data:{userId:actor.id,entity:"User",entityId:id,action:"ADMIN_EDITAR_CUENTA",payload:{previous:{login:old.login,displayName:old.displayName},next:{login,displayName},reason,sesionesRevocadas:old.login!==login}}});
 },{isolationLevel:"Serializable"});change();
}
/** ADMIN: cambiar una función principal conservando otros permisos y la identidad única. */
export async function cambiarRolPrincipalAdmin(form:FormData){
 const actor=await requireRole("ADMIN");
 if(!passwordMatches(field(form,"adminPassword",1,256),actor.passwordHash))throw new Error("Confirma tu contraseña de ADMIN");
 const id=field(form,"userId"),newRole=field(form,"role"),reason=motivoAdmin(field(form,"reason",10,500));
 await prisma.$transaction(async tx=>{
  const target=await tx.user.findUniqueOrThrow({where:{id}});
  const adminCount=await tx.user.count({where:{role:"ADMIN",active:true}});
  const allowed=validarCambioRolPrincipal(actor.id,id,target.role,newRole,adminCount);
  if(target.role===allowed)throw new Error("La cuenta ya tiene ese rol principal");
  validarVinculosRol(allowed,target.workerId,target.ownerId);
  // Evita que una función principal tenga además una autorización idéntica activa.
  await tx.userRoleGrant.updateMany({where:{userId:id,role:allowed,revokedAt:null},data:{revokedAt:new Date()}});
  await tx.user.update({where:{id},data:{role:allowed}});
  await tx.session.updateMany({where:{userId:id},data:{revokedAt:new Date()}});
  await tx.auditLog.create({data:{userId:actor.id,entity:"User",entityId:id,action:"ADMIN_CAMBIO_ROL_PRINCIPAL",payload:{previous:target.role,next:allowed,reason}}});
 },{isolationLevel:"Serializable"});change();
}
/** No borrar cuentas: desactivar conserva todas sus referencias y trazabilidad. */
export async function desactivarCuenta(form:FormData){
 const actor=await requireRole("ADMIN");
 if(!passwordMatches(field(form,"adminPassword",1,256),actor.passwordHash))throw new Error("Confirma tu contraseña de ADMIN");
 const id=field(form,"userId"),reason=motivoAdmin(field(form,"reason",10,500));
 await prisma.$transaction(async tx=>{
  const target=await tx.user.findUniqueOrThrow({where:{id}});
  if(!target.active)throw new Error("Cuenta ya desactivada");
  const adminCount=await tx.user.count({where:{role:"ADMIN",active:true}});
  validarBajaAdministrativa(actor.id,id,target.role,adminCount);
  await tx.user.update({where:{id},data:{active:false}});
  await tx.session.updateMany({where:{userId:id},data:{revokedAt:new Date()}});
  await tx.auditLog.create({data:{userId:actor.id,entity:"User",entityId:id,action:"ADMIN_DESACTIVAR_CUENTA",payload:{previous:true,next:false,reason}}});
 },{isolationLevel:"Serializable"});change();
}
/** Rehabilita una cuenta administrativa sin rehabilitar automáticamente a personal inactivo. */
export async function reactivarCuentaAdmin(form:FormData){
 const actor=await requireRole("ADMIN");
 if(!passwordMatches(field(form,"adminPassword",1,256),actor.passwordHash))throw new Error("Confirma tu contraseña de ADMIN");
 const id=field(form,"userId"),reason=motivoAdmin(field(form,"reason",10,500));
 await prisma.$transaction(async tx=>{
  const target=await tx.user.findUniqueOrThrow({where:{id},include:{worker:{select:{active:true}}}});
  validacionReactivacion(Boolean(target.workerId),target.worker?.active??false,target.active);
  await tx.user.update({where:{id},data:{active:true,failedLogins:0,lockedUntil:null}});
  await tx.session.updateMany({where:{userId:id},data:{revokedAt:new Date()}});
  await tx.auditLog.create({data:{userId:actor.id,entity:"User",entityId:id,action:"ADMIN_REACTIVAR_CUENTA",payload:{previous:false,next:true,reason}}});
 },{isolationLevel:"Serializable"});change();
}
export async function crearPropietario(form:FormData){const u=await requireRole("ADMIN","OPERACIONES","JEFE_OPERACIONES");const p=await prisma.owner.create({data:{document:field(form,"document",6,20),name:field(form,"name",3,120),contact:optionalField(form,"contact")}});await log(u.id,"Owner",p.id,"CREAR");change();}
export async function crearVehiculo(form:FormData){const u=await requireRole("ADMIN","OPERACIONES","JEFE_OPERACIONES");const ownerId=optionalField(form,"ownerId");const v=await prisma.vehicle.create({data:{code:field(form,"code",2,30),plate:field(form,"plate",5,12).toUpperCase(),type:validarTipoUnidadKCJ(field(form,"type",3,50)),make:optionalField(form,"make"),model:optionalField(form,"model"),year:form.get("year")?enteroOperativo(numberField(form,"year",1980,2100),1980,2100):null,color:optionalField(form,"color",50),vin:optionalField(form,"vin",50),engineNumber:optionalField(form,"engineNumber",50),mineCode:optionalField(form,"mineCode",50),ownerId}});await log(u.id,"Vehicle",v.id,"CREAR");change();}
export async function registrarDocumento(form:FormData){const u=await requireRole("ADMIN","OPERACIONES","JEFE_OPERACIONES","HOMOLOGACION");if(flag(form,"verified")){const key=field(form,"evidenceKey",8,400);await requireEvidence(key,"FLOTA")}const d=await prisma.vehicleDocument.create({data:{vehicleId:field(form,"vehicleId"),kind:field(form,"kind"),expiresAt:instant(form,"expiresAt"),reference:optionalField(form,"reference"),evidenceKey:optionalField(form,"evidenceKey",400),verifiedAt:flag(form,"verified")?new Date():null}});await log(u.id,"VehicleDocument",d.id,"REGISTRAR_VERSION");change();}
export async function registrarOdometro(form:FormData){const u=await requireRole("ADMIN","OPERACIONES","MANTENIMIENTO","JEFE_OPERACIONES");const vehicleId=field(form,"vehicleId");const kilometers=enteroOperativo(numberField(form,"kilometers",0,10000000),0,10000000);const last=await prisma.odometerReading.findFirst({where:{vehicleId},orderBy:{at:"desc"}});if(last&&kilometers<last.kilometers)throw new Error("Odómetro menor al anterior: requiere revisión antes de registrar");await requireEvidence(field(form,"evidenceKey",8,400),"FLOTA");const r=await prisma.odometerReading.create({data:{vehicleId,kilometers,evidenceKey:optionalField(form,"evidenceKey",400)}});await log(u.id,"OdometerReading",r.id,"REGISTRAR");change();}
export async function crearMantenimiento(form:FormData){const u=await requireRole("MANTENIMIENTO","ADMIN");const o=await prisma.workOrder.create({data:{vehicleId:field(form,"vehicleId"),issue:field(form,"issue",5,1000),critical:flag(form,"critical")}});await log(u.id,"WorkOrder",o.id,"ABRIR");change();}
export async function liberarMantenimiento(form:FormData){const u=await requireRole("MANTENIMIENTO");const id=field(form,"id");const evidenceKey=field(form,"evidenceKey",8,400);await requireEvidence(evidenceKey,"MANTENIMIENTO");await prisma.$transaction(async tx=>{const row=await tx.workOrder.findUniqueOrThrow({where:{id}});if(row.status==="LIBERADA")throw new Error("Orden ya liberada");await tx.workOrder.update({where:{id},data:{status:"LIBERADA",releasedAt:new Date(),releasedBy:u.id,evidenceKey}});await tx.auditLog.create({data:{userId:u.id,entity:"WorkOrder",entityId:id,action:"LIBERACION_TECNICA",payload:{evidenceKey}}});});change();}
export async function crearHabilitacion(form:FormData){const u=await requireRole("HOMOLOGACION","ADMIN","OPERACIONES","JEFE_OPERACIONES");const workerId=optionalField(form,"workerId");const vehicleId=optionalField(form,"vehicleId");if(!workerId&&!vehicleId||workerId&&vehicleId)throw new Error("Seleccione una única entidad: trabajador o vehículo");const kind=field(form,"kind");if(!["TARJETA_AMARILLA","CONDUCTOR_MINA","CURSO_EXTERNO"].includes(kind))throw new Error("Tipo de habilitación inválido");if(kind==="TARJETA_AMARILLA"&&!vehicleId||kind!=="TARJETA_AMARILLA"&&!workerId)throw new Error("Tarjeta Amarilla requiere unidad; habilitación personal requiere colaborador");if(flag(form,"verified")){await requireEvidence(field(form,"evidenceKey",8,400),"HOMOLOGACION")}const c=await prisma.clearance.create({data:{workerId,vehicleId,kind,scope:field(form,"scope"),reference:optionalField(form,"reference",120),issuedAt:optionalDate(form,"issuedAt"),validUntil:instant(form,"validUntil"),verified:flag(form,"verified"),evidenceKey:optionalField(form,"evidenceKey",400)}});await log(u.id,"Clearance",c.id,"REGISTRAR_VERSION");change();}
export async function registrarAptitud(form:FormData){const u=await requireRole("SALUD");const status=field(form,"status") as "APTO"|"RESTRINGIDO"|"NO_APTO"|"PENDIENTE";if(!["APTO","RESTRINGIDO","NO_APTO","PENDIENTE"].includes(status))throw new Error("Estado inválido");const workerId=field(form,"workerId");const v=await prisma.medicalFitness.upsert({where:{workerId},create:{workerId,status,validUntil:instant(form,"validUntil"),reviewedBy:u.id},update:{status,validUntil:instant(form,"validUntil"),reviewedBy:u.id,reviewedAt:new Date()}});await log(u.id,"MedicalFitness",v.id,"ACTUALIZAR_APTITUD",{status,validUntil:v.validUntil.toISOString()});change();}
export async function crearRoster(form:FormData){
 const u=await requireRole("OPERACIONES","JEFE_OPERACIONES"),workerId=field(form,"workerId");
 const startsAt=instant(form,"startsAt"),endsAt=instant(form,"endsAt");
 if(!validInterval({startsAt,endsAt}))throw new Error("Intervalo incorrecto");
 const kind=field(form,"kind");if(kind!=="GUARDIA"&&kind!=="DESCANSO")throw new Error("Tipo de jornada no válido");
 await prisma.$transaction(async tx=>{
  const worker=await tx.worker.findUnique({where:{id:workerId},select:{active:true}});
  if(!worker?.active)throw new Error("El colaborador debe estar activo para programar una guardia");
  const same=await tx.roster.findMany({where:{workerId,startsAt:{lt:endsAt},endsAt:{gt:startsAt}}});
  if(same.some(x=>overlaps({startsAt,endsAt},x)))throw new Error("El ROSTER se solapa con otra programación");
  const r=await tx.roster.create({data:{workerId,startsAt,endsAt,kind,createdBy:u.id}});
  await tx.auditLog.create({data:{userId:u.id,entity:"Roster",entityId:r.id,action:"BORRADOR"}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});change();
}
export async function publicarRoster(form:FormData){
 const u=await requireRole("JEFE_OPERACIONES"),id=field(form,"id");
 await prisma.$transaction(async tx=>{
  const r=await tx.roster.findUniqueOrThrow({where:{id}});
  if(r.status!=="BORRADOR")throw new Error("El ROSTER ya fue publicado o no está en borrador");
  const others=await tx.roster.findMany({where:{workerId:r.workerId,status:"PUBLICADO",id:{not:id},startsAt:{lt:r.endsAt},endsAt:{gt:r.startsAt}}});
  if(others.some(x=>overlaps({startsAt:r.startsAt,endsAt:r.endsAt},x)))throw new Error("Cruce con ROSTER publicado");
  await tx.roster.update({where:{id,status:"BORRADOR"},data:{status:"PUBLICADO",publishedBy:u.id,publishedAt:new Date()}});
  await tx.auditLog.create({data:{userId:u.id,entity:"Roster",entityId:id,action:"PUBLICAR"}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});change();
}
export async function crearServicio(form:FormData){const u=await requireRole("OPERACIONES","JEFE_OPERACIONES");const startsAt=instant(form,"startsAt"),endsAt=instant(form,"endsAt");if(!validInterval({startsAt,endsAt}))throw new Error("Horas inválidas");const s=await prisma.service.create({data:{code:field(form,"code",3,40),customer:field(form,"customer",2,120),route:field(form,"route",3,300),startsAt,endsAt,mineRequired:flag(form,"mineRequired"),mineScope:flag(form,"mineRequired")?field(form,"mineScope",3,120):null}});await log(u.id,"Service",s.id,"CREAR");change();}
export async function asignarServicio(form:FormData){
 const u=await requireRole("OPERACIONES","JEFE_OPERACIONES");
 const id=field(form,"id"),workerId=field(form,"workerId"),vehicleId=field(form,"vehicleId");
 await prisma.$transaction(async tx=>{
  const s=await tx.service.findUniqueOrThrow({where:{id}});
  if(s.status!=="PLANIFICADO")throw new Error("Solo se asignan servicios planificados");
  const reasons=await comprobarAsignacion(workerId,vehicleId,s.startsAt,s.endsAt,s.mineRequired,id,s.mineScope,tx);
  if(reasons.length)throw new Error(`Asignación bloqueada: ${reasons.join("; ")}`);
  await tx.service.update({where:{id,status:"PLANIFICADO"},data:{workerId,vehicleId,status:"ASIGNADO"}});
  await tx.auditLog.create({data:{userId:u.id,entity:"Service",entityId:id,action:"ASIGNAR",payload:{workerId,vehicleId}}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});change();
}
export async function iniciarServicio(form:FormData){
 const u=await requireUser(),panel=await panelActual(u);
 const id=field(form,"serviceId"),clientEventId=field(form,"clientEventId",8,100);
 if(!panel)throw new Error("Selecciona tu panel de trabajo antes de iniciar un servicio");
 await prisma.$transaction(async tx=>{
  const s=await tx.service.findUniqueOrThrow({where:{id}});
  autorizarOperacionServicio(panel,u.workerId,s.workerId,tieneRol(u,"OPERACIONES","JEFE_OPERACIONES"));
  const exists=await tx.serviceEvent.findUnique({where:{clientEventId}});
  if(exists){if(exists.serviceId!==id||exists.type!=="INICIO")throw new Error("ID de evento duplicado");return;}
  if(s.status!=="ASIGNADO"||!s.workerId||!s.vehicleId)throw new Error("Servicio sin conductor o unidad asignados");
  // Entre asignación e inicio pueden vencer permisos, cambiar guardias o abrirse fallas críticas.
  const reasons=await comprobarAsignacion(s.workerId,s.vehicleId,s.startsAt,s.endsAt,s.mineRequired,id,s.mineScope,tx);
  if(reasons.length)throw new Error(`No se puede iniciar el servicio: ${reasons.join("; ")}`);
  await tx.service.update({where:{id,status:"ASIGNADO"},data:{status:"EN_CURSO",startedAt:new Date()}});
  await tx.serviceEvent.create({data:{serviceId:id,clientEventId,type:"INICIO",occurredAt:new Date()}});
  await tx.auditLog.create({data:{userId:u.id,entity:"Service",entityId:id,action:"INICIO"}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});change();
}
export async function crearTareo(form:FormData){
 const u=await requireRole("OPERACIONES","JEFE_OPERACIONES","ADMIN");
 const workerId=field(form,"workerId"),startsAt=instant(form,"startsAt"),endsAt=instant(form,"endsAt");
 const hours=hoursBetween(startsAt,endsAt),source=validarOrigenTareo(field(form,"origin"));
 if(endsAt.getTime()>Date.now())throw new Error("No se puede registrar tiempo de trabajo que todavía no ha transcurrido");
 const serviceId=source==="SERVICIO"?field(form,"serviceId"):null;
 const reason=source==="REGISTRO_INTERNO"?motivoRegistroInterno(optionalField(form,"reason",500)):null;
 await prisma.$transaction(async tx=>{
  const worker=await tx.worker.findUnique({where:{id:workerId},select:{id:true,area:true,secondaryArea:true,active:true}});
  if(!worker||!worker.active)throw new Error("Colaborador inexistente o inactivo");
  const areaAtEntry=optionalField(form,"areaAtEntry")??worker.area;
  if(areaAtEntry!==worker.area&&areaAtEntry!==worker.secondaryArea)throw new Error("El colaborador no tiene asignada el área laboral indicada para este tareo.");
  if(source==="SERVICIO"){
   const servicio=await tx.service.findUnique({where:{id:serviceId!}});
   if(!servicio)throw new Error("Servicio de origen inexistente");
   validarVinculoServicioTareo({workerId,servicio,startsAt,endsAt});
  }
  const exists=await tx.timesheet.findFirst({where:{workerId,status:{not:"OBSERVADO"},startsAt:{lt:endsAt},endsAt:{gt:startsAt}}});
  if(exists)throw new Error("Tareo solapado o duplicado");
  const t=await tx.timesheet.create({data:{workerId,serviceId,startsAt,endsAt,hours,source,areaAtEntry,reason}});
  await tx.auditLog.create({data:{userId:u.id,entity:"Timesheet",entityId:t.id,action:"REGISTRAR",payload:{areaObtenidaDeFicha:areaAtEntry,origen:source,serviceId,horas:hours,motivo:reason}}});
 },{isolationLevel:"Serializable"});
 change();
}
export async function validarTareo(form:FormData){const u=await requireRole("RRHH");const id=field(form,"id");await prisma.$transaction(async tx=>{await tx.timesheet.update({where:{id,status:"PENDIENTE"},data:{status:"VALIDADO",reviewerId:u.id}});await tx.auditLog.create({data:{userId:u.id,entity:"Timesheet",entityId:id,action:"VALIDAR"}});});change();}
export async function registrarContrato(form:FormData){const u=await requireRole("RRHH");const key=optionalField(form,"evidenceKey",400);if(key)await requireEvidence(key,"RRHH");const c=await prisma.contract.create({data:{workerId:field(form,"workerId"),kind:field(form,"kind",3,100),startsAt:instant(form,"startsAt"),endsAt:optionalDate(form,"endsAt"),evidenceKey:optionalField(form,"evidenceKey",400)}});await log(u.id,"Contract",c.id,"REGISTRAR");change();}
/** La captura antigua sin inventario queda bloqueada para evitar actas incompletas. */
export async function registrarCustodia(_form:FormData):Promise<void>{
 await requireRole("OPERACIONES","JEFE_OPERACIONES","ADMIN");
 throw new Error("Registra las actas desde la ficha de Entrega y recepción de la unidad, con inventario comparativo");
}

export async function crearCaso(form:FormData){const u=await requireRole("SSOMA","OPERACIONES","JEFE_OPERACIONES","CONDUCTOR"),panel=await panelActual(u);const v=optionalField(form,"vehicleId"),w=optionalField(form,"workerId");if(panel==="conductor"&&(!u.workerId||w!==u.workerId))throw new Error("El conductor solo reporta su propio caso");const evidenceKey=optionalField(form,"evidenceKey",400);if(evidenceKey)await requireEvidenceOwnedAny(evidenceKey,["CONNECT","SSOMA"],u.id);const category=field(form,"category");if(!["Incidente","Accidente","Condición insegura","Inspección","IPERC","Observación"].includes(category))throw new Error("Categoría no válida");const c=await prisma.safetyCase.create({data:{evidenceKey,reference:`SSO-${Date.now()}-${Math.floor(Math.random()*10000)}`,category,severity:severidadSSOMA(field(form,"severity")),title:field(form,"title",5,150),details:field(form,"details",10,3000),workerId:w,vehicleId:v}});await log(u.id,"SafetyCase",c.id,"REPORTAR");change();}
export async function agregarAccion(form:FormData){const u=await requireRole("SSOMA");const caseId=field(form,"caseId");const c=await prisma.safetyCase.findUniqueOrThrow({where:{id:caseId}});if(c.status==="CERRADO")throw new Error("Caso cerrado");const a=await prisma.safetyAction.create({data:{caseId,description:field(form,"description",5,1000),responsible:field(form,"responsible",3,150),dueAt:instant(form,"dueAt")}});await log(u.id,"SafetyAction",a.id,"CREAR");change();}
export async function verificarAccion(form:FormData){const u=await requireRole("SSOMA");const id=field(form,"id"),evidenceKey=field(form,"evidenceKey",8,400);await requireEvidence(evidenceKey,["SSOMA","CONNECT"]);await prisma.$transaction(async tx=>{const a=await tx.safetyAction.findUniqueOrThrow({where:{id}});if(a.status==="VERIFICADA")throw new Error("Acción ya verificada");await tx.safetyAction.update({where:{id},data:{status:"VERIFICADA",evidenceKey,verifiedBy:u.id,verifiedAt:new Date()}});await tx.auditLog.create({data:{userId:u.id,entity:"SafetyAction",entityId:id,action:"VERIFICAR",payload:{evidenceKey}}});});change();}
export async function cerrarCaso(form:FormData){const u=await requireRole("SSOMA");const id=field(form,"id");const closureReason=optionalField(form,"closureReason",1000)??"";await prisma.$transaction(async tx=>{const c=await tx.safetyCase.findUniqueOrThrow({where:{id},include:{actions:true}});if(c.status==="CERRADO")throw new Error("Ya está cerrado");if(!mayCloseSafetyCase(c.actions,closureReason))throw new Error("Existen acciones sin evidencia/verificación o falta justificación técnica");await tx.safetyCase.update({where:{id},data:{status:"CERRADO",closureReason,closedAt:new Date(),closedBy:u.id}});await tx.auditLog.create({data:{userId:u.id,entity:"SafetyCase",entityId:id,action:"CERRAR",payload:{closureReason}}});});change();}
export async function reabrirCaso(form:FormData){const u=await requireRole("SSOMA");const id=field(form,"id"),reason=field(form,"reason",12,1000);await prisma.$transaction(async tx=>{const c=await tx.safetyCase.findUniqueOrThrow({where:{id}});if(c.status!=="CERRADO")throw new Error("Solo se reabren casos cerrados");await tx.safetyCase.update({where:{id},data:{status:"ABIERTO",closureReason:null,closedAt:null,closedBy:null}});await tx.auditLog.create({data:{userId:u.id,entity:"SafetyCase",entityId:id,action:"REABRIR",payload:{reason,previousClosure:c.closureReason,previousClosedAt:c.closedAt?.toISOString()}}});});change();}
export async function crearInventario(form:FormData){const u=await requireRole("ALMACEN","ADMIN","OPERACIONES","JEFE_OPERACIONES");const i=await prisma.inventoryItem.create({data:{sku:field(form,"sku",2,40),name:field(form,"name",3,150),unit:validarUnidadMedidaKCJ(field(form,"unit",1,30))}});await log(u.id,"InventoryItem",i.id,"CREAR");change();}
export async function moverInventario(form:FormData){const u=await requireRole("ALMACEN","OPERACIONES","JEFE_OPERACIONES");const itemId=field(form,"itemId");const delta=deltaInventario(field(form,"direction"),numberField(form,"quantity",1,100000));const reason=field(form,"reason",5,500);await prisma.$transaction(async tx=>{const current=await tx.inventoryItem.findUniqueOrThrow({where:{id:itemId}});if(current.quantity+delta<0)throw new Error("Inventario insuficiente");const updated=await tx.inventoryItem.updateMany({where:{id:itemId,quantity:current.quantity},data:{quantity:{increment:delta}}});if(updated.count!==1)throw new Error("Stock modificado por otro usuario. Vuelva a intentar");const m=await tx.stockMovement.create({data:{itemId,delta,reason,actorId:u.id}});await tx.auditLog.create({data:{userId:u.id,entity:"StockMovement",entityId:m.id,action:delta<0?"SALIDA":"INGRESO",payload:{delta,reason}}});});change();}
export async function finalizarServicio(form:FormData){
 const u=await requireUser(),panel=await panelActual(u);
 const id=field(form,"id"),clientEventId=field(form,"clientEventId",8,100);
 if(!panel)throw new Error("Selecciona tu panel de trabajo antes de finalizar un servicio");
 await prisma.$transaction(async tx=>{
  const s=await tx.service.findUniqueOrThrow({where:{id}});
  autorizarOperacionServicio(panel,u.workerId,s.workerId,tieneRol(u,"OPERACIONES","JEFE_OPERACIONES"));
  const old=await tx.serviceEvent.findUnique({where:{clientEventId}});
  if(old){if(old.serviceId!==id||old.type!=="FINALIZACION")throw new Error("Evento en conflicto");return;}
  if(s.status!=="EN_CURSO")throw new Error("Servicio no iniciado o ya finalizado");
  await tx.service.update({where:{id,status:"EN_CURSO"},data:{status:"FINALIZADO",endedAt:new Date()}});
  await tx.serviceEvent.create({data:{serviceId:id,clientEventId,type:"FINALIZACION",occurredAt:new Date()}});
  await tx.auditLog.create({data:{userId:u.id,entity:"Service",entityId:id,action:"FINALIZAR"}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});change();
}
export async function cambiarUnidad(form:FormData){
 const u=await requireRole("OPERACIONES","JEFE_OPERACIONES");
 const id=field(form,"id"),vehicleId=field(form,"vehicleId"),reason=field(form,"reason",12,1000);
 await prisma.$transaction(async tx=>{
  const s=await tx.service.findUniqueOrThrow({where:{id}});
  if(!s.workerId||!s.vehicleId||s.status!=="EN_CURSO")throw new Error("Servicio no está en curso con conductor y unidad");
  if(s.vehicleId===vehicleId)throw new Error("Debe indicar otra unidad");
  const reasons=await comprobarAsignacion(s.workerId,vehicleId,s.startsAt,s.endsAt,s.mineRequired,id,s.mineScope,tx);
  if(reasons.length)throw new Error(`Cambio no permitido: ${reasons.join("; ")}`);
  await tx.service.update({where:{id,status:"EN_CURSO"},data:{vehicleId}});
  await tx.serviceEvent.create({data:{serviceId:id,clientEventId:randomUUID(),type:"CAMBIO_UNIDAD",description:reason,occurredAt:new Date()}});
  await tx.auditLog.create({data:{userId:u.id,entity:"Service",entityId:id,action:"CAMBIO_UNIDAD",payload:{anterior:s.vehicleId,nueva:vehicleId,reason}}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});change();
}
export async function actualizarTrabajador(form:FormData){
 const u=await requireRole("RRHH","ADMIN");
 const id=field(form,"id");
 const status=field(form,"status");
 if(status!=="ACTIVO"&&status!=="INACTIVO")throw new Error("Estado laboral inválido.");
 const active=status==="ACTIVO";
 const reason=field(form,"reason",5,500);
 await prisma.$transaction(async tx=>{
  const before=await tx.worker.findUniqueOrThrow({where:{id}});
  const catalog=await tx.workArea.findMany({where:{active:true},select:{name:true}});
  // Se admiten áreas históricas del mismo colaborador aunque luego cambie el catálogo.
  const available=[...new Set([...catalog.map(x=>x.name),before.area,...(before.secondaryArea?[before.secondaryArea]:[])])];
  const areas=validarAreasTrabajo(field(form,"area",2,100),optionalField(form,"secondaryArea"),available);
  if(before.area===areas.area&&before.secondaryArea===areas.secondaryArea&&before.active===active)throw new Error("No se detectaron cambios en la ficha.");
  const accAntes=await tx.user.findUnique({where:{workerId:id},select:{id:true,role:true}});
  if(accAntes?.role==="CONDUCTOR"&&active&&!tieneAreaConductor(areas)){
   throw new Error("Primero actualiza la función principal Conductor de la cuenta antes de retirar el área Conductor.");
  }
  await tx.worker.update({where:{id},data:{...areas,active}});
  if(accAntes){
   if(active&&tieneAreaConductor(areas)&&accAntes.role!=="CONDUCTOR"){
    await tx.userRoleGrant.upsert({where:{userId_role:{userId:accAntes.id,role:"CONDUCTOR"}},create:{userId:accAntes.id,role:"CONDUCTOR",grantedBy:u.id},update:{revokedAt:null,grantedAt:new Date(),grantedBy:u.id}});
   }else if(!tieneAreaConductor(areas)){
    await tx.userRoleGrant.updateMany({where:{userId:accAntes.id,role:"CONDUCTOR",revokedAt:null},data:{revokedAt:new Date()}});
   }
   // La próxima entrada debe volver a seleccionar el panel válido con permisos actualizados.
   await tx.session.updateMany({where:{userId:accAntes.id},data:{revokedAt:new Date()}});
  }
  if(!active){
   const acc=await tx.user.findUnique({where:{workerId:id}});
   if(acc){
    if(acc.role==="ADMIN"){
     const activos=await tx.user.count({where:{role:"ADMIN",active:true}});
     validarBajaAdministrativa(u.id,acc.id,acc.role,activos);
    }
    await tx.user.update({where:{id:acc.id},data:{active:false}});
    await tx.session.updateMany({where:{userId:acc.id},data:{revokedAt:new Date()}});
   }
  }
  await tx.auditLog.create({data:{userId:u.id,entity:"Worker",entityId:id,action:"ACTUALIZAR_AREAS_ESTADO",payload:{previous:{areaPrincipal:before.area,areaSecundaria:before.secondaryArea,active:before.active},next:{areaPrincipal:areas.area,areaSecundaria:areas.secondaryArea,active},reason}}});
 },{isolationLevel:"Serializable"});change();
}

export async function otorgarRol(form:FormData){
 const actor=await requireRole("ADMIN");const userId=field(form,"userId");const role=field(form,"role") as Role;const reason=field(form,"reason",10,300);
 const allowed:Role[]=["GERENCIA","OPERACIONES","JEFE_OPERACIONES","SSOMA","MANTENIMIENTO","RRHH","SALUD","HOMOLOGACION","INSTRUCTOR","ALMACEN","CONDUCTOR"];
 if(!allowed.includes(role))throw new Error("Solo se pueden añadir funciones autorizadas; propietario vehicular requiere su vínculo independiente.");
 await prisma.$transaction(async tx=>{
  const target=await tx.user.findUniqueOrThrow({where:{id:userId}});if(!target.active)throw new Error("Cuenta inactiva");if(target.role===role)throw new Error("La cuenta ya tiene ese rol principal");
  if(role==="CONDUCTOR"&&!target.workerId)throw new Error("Para asignar Conductor, primero vincule la cuenta con una ficha laboral única.");
  if(role==="CONDUCTOR"){
   const ficha=await tx.worker.findUniqueOrThrow({where:{id:target.workerId!},select:{area:true,secondaryArea:true}});
   validarRolConductorEnFicha(role,ficha);
  }
  await tx.userRoleGrant.upsert({where:{userId_role:{userId,role}},create:{userId,role,grantedBy:actor.id},update:{grantedBy:actor.id,grantedAt:new Date(),revokedAt:null}});
  await tx.session.updateMany({where:{userId},data:{revokedAt:new Date()}});
  await tx.auditLog.create({data:{userId:actor.id,entity:"User",entityId:userId,action:"AUTORIZAR_FUNCION",payload:{role,reason}}});
 });change();
}
export async function revocarRol(form:FormData){
 const actor=await requireRole("ADMIN");const userId=field(form,"userId");const role=field(form,"role") as Role;const reason=field(form,"reason",10,300);
 await prisma.$transaction(async tx=>{
  const target=await tx.user.findUniqueOrThrow({where:{id:userId}});if(target.role===role)throw new Error("No se puede revocar el rol principal aquí");
  const changed=await tx.userRoleGrant.updateMany({where:{userId,role,revokedAt:null},data:{revokedAt:new Date()}});if(!changed.count)throw new Error("La función no estaba activa para esta cuenta");
  await tx.session.updateMany({where:{userId},data:{revokedAt:new Date()}});
  await tx.auditLog.create({data:{userId:actor.id,entity:"User",entityId:userId,action:"REVOCAR_FUNCION",payload:{role,reason}}});
 });change();
}

/** Una recepción administrativa no habilita una unidad: faltan ambas conformidades. */
export async function verificarRecepcionTecnica(form:FormData){
 const u=await requireRole("MANTENIMIENTO");
 const id=field(form,"id");
 await prisma.$transaction(async tx=>{
  const e=await tx.custodyEvent.findUniqueOrThrow({where:{id}});
  const last=await tx.custodyEvent.findFirst({where:{vehicleId:e.vehicleId},orderBy:{at:"desc"}});
  if(last?.id!==id||e.kind!=="RECEPCION")throw new Error("La recepción no es el evento vigente");
  if(e.technicalVerifiedAt)throw new Error("Recepción ya validada técnicamente");
  const unresolved=await tx.custodyInventoryLine.count({where:{custodyEventId:id,discrepancy:true,resolvedAt:null}});
  if(unresolved>0)throw new Error("Hay diferencias de inventario sin resolución documentada");
  const critical=await tx.workOrder.count({where:{vehicleId:e.vehicleId,status:{not:"LIBERADA"}}});
  if(critical)throw new Error("Existen órdenes de mantenimiento sin liberar");
  await tx.custodyEvent.update({where:{id},data:{technicalVerifiedAt:new Date(),technicalVerifiedBy:u.id}});
  await tx.auditLog.create({data:{userId:u.id,entity:"CustodyEvent",entityId:id,action:"REVISION_TECNICA_CONFORME"}});
 });change();
}
export async function verificarRecepcionSSOMA(form:FormData){
 const u=await requireRole("SSOMA");const id=field(form,"id");
 await prisma.$transaction(async tx=>{
  const e=await tx.custodyEvent.findUniqueOrThrow({where:{id}});
  const last=await tx.custodyEvent.findFirst({where:{vehicleId:e.vehicleId},orderBy:{at:"desc"}});
  if(last?.id!==id||e.kind!=="RECEPCION")throw new Error("La recepción no es el evento vigente");
  if(e.safetyVerifiedAt)throw new Error("Recepción ya revisada por SSOMA");
  const unresolved=await tx.custodyInventoryLine.count({where:{custodyEventId:id,discrepancy:true,resolvedAt:null}});
  if(unresolved>0)throw new Error("Hay diferencias de inventario sin resolución documentada");
  const critical=await tx.safetyCase.count({where:{vehicleId:e.vehicleId,severity:"CRITICA",status:{not:"CERRADO"}}});
  if(critical)throw new Error("Existe restricción de seguridad crítica abierta");
  await tx.custodyEvent.update({where:{id},data:{safetyVerifiedAt:new Date(),safetyVerifiedBy:u.id}});
  await tx.auditLog.create({data:{userId:u.id,entity:"CustodyEvent",entityId:id,action:"REVISION_SSOMA_CONFORME"}});
 });change();
}
