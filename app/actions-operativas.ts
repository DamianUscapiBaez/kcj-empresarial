"use server";
import { requireEvidence, requireEvidenceOwnedAny } from "@/lib/evidencias";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth";
import { tieneRol } from "@/lib/permisos-kcj";
import {
  field,
  optionalField,
  optionalDate,
  numberField,
  instant,
  flag,
} from "@/lib/form";
import {
  validInterval,
  overlaps,
  hoursBetween,
  mayCloseSafetyCase,
} from "@/lib/dominio-kcj";
import { comprobarAsignacion } from "@/lib/operaciones";
import { passwordHash, passwordMatches } from "@/lib/crypto";
import {
  validarClaveAsignada,
  validarRestablecimientoAdmin,
  MIN_LONGITUD_CLAVE,
  MAX_LONGITUD_CLAVE,
} from "@/lib/politica-contrasenas";
import { validarTipoUnidadKCJ } from "@/lib/tipos-unidad";
import { validarUnidadMedidaKCJ } from "@/lib/unidades-medida";
import {
  severidadSSOMA,
  deltaInventario,
  rolAltaColaborador,
  validarAltaConAcceso,
  enteroOperativo,
} from "@/lib/validaciones-prepiloto";
import { validarAreasTrabajo, nombreNuevaArea } from "@/lib/areas-trabajo";
import {
  tieneAreaConductor,
  validarRolConductorEnFicha,
} from "@/lib/acceso-conductor-laboral";
import {
  dniCuentaInicial,
  rolesDesdeAreas,
  nombreNormalizado,
  nombreEsPosibleDuplicado,
} from "@/lib/cuentas-por-area";
import { permitirVinculacion } from "@/lib/propietarios-kcj";
import {
  validarContactoCelular,
  validarLicenciaColaborador,
} from "@/lib/licencia-colaborador";
import {
  validarOrigenTareo,
  validarVinculoServicioTareo,
  motivoRegistroInterno,
} from "@/lib/tareo-kcj";
import {
  validarHomologacionPersonal,
  validarPaseMineroVehicular,
  documentoGeneralValido,
} from "@/lib/requisitos-mineros-kcj";
import { Prisma, type Role } from "@prisma/client";
import { panelActual } from "@/lib/panel-sesion";
import { autorizarOperacionServicio } from "@/lib/validaciones-prepiloto";
import {
  esRolKCJ,
  validarCambioRolPrincipal,
  validarBajaAdministrativa,
  validarVinculosRol,
  validacionReactivacion,
  motivoAdmin,
} from "@/lib/superadmin-policy";
import {
  ADMIN_PRINCIPAL_SINGLETON,
  bloquearCambioCuentaPrincipal,
} from "@/lib/administrador-principal";
const change = () => revalidatePath("/dashboard", "layout");
/** Guardia transaccional: comprueba la protección persistida antes de cada mutación administrativa. */
async function exigirNoProtegida(
  tx: Prisma.TransactionClient,
  targetUserId: string,
) {
  const p = await tx.primaryAdminProtection.findUnique({
    where: { id: ADMIN_PRINCIPAL_SINGLETON },
    select: { userId: true },
  });
  bloquearCambioCuentaPrincipal(p?.userId, targetUserId);
}

async function log(
  userId: string,
  entity: string,
  entityId: string,
  action: string,
  payload?: object,
) {
  await prisma.auditLog.create({
    data: { userId, entity, entityId, action, payload },
  });
}
/** Personal: una sola ficha laboral; una segunda área es opcional. Los permisos se asignan aparte. */
export async function crearTrabajador(form: FormData) {
  const u = await requireRole("ADMIN", "RRHH");
  const document = field(form, "document", 6, 16),
    name = nombreNormalizado(field(form, "name", 3, 150));
  const license = optionalField(form, "license"),
    licenseExpires = optionalDate(form, "licenseExpires");
  const licenseCategory = optionalField(form, "licenseCategory", 24),
    licenseIssuedAt = optionalDate(form, "licenseIssuedAt");
  const phone = validarContactoCelular(optionalField(form, "phone", 22));
  validarLicenciaColaborador(
    license,
    licenseCategory,
    licenseExpires,
    licenseIssuedAt,
  );
  const crearAcceso = flag(form, "crearAcceso");
  validarAltaConAcceso(crearAcceso, u.role === "ADMIN");
  if (crearAcceso) dniCuentaInicial(document);
  await prisma.$transaction(
    async (tx) => {
      const catalog = await tx.workArea.findMany({
        where: { active: true },
        select: { name: true },
      });
      const areas = validarAreasTrabajo(
        field(form, "area", 2, 100),
        optionalField(form, "secondaryArea"),
        catalog.map((x) => x.name),
      );
      if (
        await tx.worker.findUnique({
          where: { document },
          select: { id: true },
        })
      )
        throw new Error(
          "El DNI/documento ya está registrado. Busca la ficha existente: no se permiten duplicados.",
        );
      // Un mismo nombre con otro documento puede ser un homónimo legítimo; se solicita revisión, nunca se fusionan fichas automáticamente.
      const semejantes = await tx.worker.findMany({
        where: { name: { equals: name, mode: "insensitive" } },
        select: { document: true, name: true },
        take: 10,
      });
      if (
        semejantes.some(
          (x) =>
            x.document !== document && nombreEsPosibleDuplicado(x.name, name),
        )
      )
        throw new Error(
          "Ya existe un colaborador con el mismo nombre y otro documento. Verifica la identidad antes de continuar para evitar duplicados.",
        );
      const p = await tx.worker.create({
        data: {
          document,
          name,
          job: "Sin especificar",
          ...areas,
          license,
          licenseCategory,
          licenseIssuedAt,
          licenseExpires,
          phone,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: u.id,
          entity: "Worker",
          entityId: p.id,
          action: "REGISTRAR_COLABORADOR",
          payload: {
            areaPrincipal: areas.area,
            areaSecundaria: areas.secondaryArea,
          },
        },
      });
      if (crearAcceso) {
        const dni = dniCuentaInicial(document);
        if (
          await tx.user.findUnique({
            where: { login: dni },
            select: { id: true },
          })
        )
          throw new Error(
            "Ya existe una cuenta con ese DNI. No se creó otra cuenta.",
          );
        const acceso = rolesDesdeAreas(areas);
        const nuevo = await tx.user.create({
          data: {
            workerId: p.id,
            login: dni,
            displayName: name,
            role: acceso.principal as Role,
            passwordHash: passwordHash(dni),
            mustChangePassword: false,
          },
        });
        for (const rol of acceso.adicionales)
          await tx.userRoleGrant.create({
            data: { userId: nuevo.id, role: rol as Role, grantedBy: u.id },
          });
        await tx.auditLog.create({
          data: {
            userId: u.id,
            entity: "User",
            entityId: nuevo.id,
            action: "ALTA_INTEGRADA_DNI",
            payload: {
              workerId: p.id,
              areaPrincipal: areas.area,
              areaSecundaria: areas.secondaryArea,
              rolInicial: acceso.principal,
              rolesAdicionales: acceso.adicionales,
            },
          },
        });
      }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  change();
  redirect(
    crearAcceso
      ? "/dashboard/personal?registro=cuenta"
      : "/dashboard/personal?registro=ficha",
  );
}
/** Centro de Control configura los nombres de las áreas sin crear nuevos roles del sistema. */
export async function crearAreaTrabajo(form: FormData) {
  const u = await requireRole("ADMIN");
  const name = nombreNuevaArea(field(form, "name", 3, 100));
  await prisma.$transaction(async (tx) => {
    const existing = await tx.workArea.findMany({ select: { name: true } });
    if (
      existing.some(
        (x) =>
          x.name.toLocaleLowerCase("es-PE") === name.toLocaleLowerCase("es-PE"),
      )
    )
      throw new Error("Ya existe un área de trabajo con ese nombre.");
    await tx.workArea.create({ data: { name } });
    await tx.auditLog.create({
      data: {
        userId: u.id,
        entity: "WorkArea",
        entityId: name,
        action: "CREAR_AREA_TRABAJO",
        payload: { name },
      },
    });
  });
  change();
}

/** Desactivar sin borrar historial. No permitir ocultar un área usada por personas activas. */
export async function desactivarAreaTrabajo(form: FormData) {
  const u = await requireRole("ADMIN");
  const name = field(form, "name", 3, 100),
    reason = field(form, "reason", 5, 500);
  await prisma.$transaction(
    async (tx) => {
      const area = await tx.workArea.findUniqueOrThrow({ where: { name } });
      if (!area.active) throw new Error("El área ya está desactivada.");
      const used = await tx.worker.count({
        where: { active: true, OR: [{ area: name }, { secondaryArea: name }] },
      });
      if (used)
        throw new Error(
          "No puedes desactivar esta área mientras tenga colaboradores activos. Reasígnalos primero.",
        );
      await tx.workArea.update({ where: { name }, data: { active: false } });
      await tx.auditLog.create({
        data: {
          userId: u.id,
          entity: "WorkArea",
          entityId: name,
          action: "DESACTIVAR_AREA",
          payload: { reason },
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  change();
}
export async function reactivarAreaTrabajo(form: FormData) {
  const u = await requireRole("ADMIN"),
    name = field(form, "name", 3, 100),
    reason = field(form, "reason", 5, 500);
  await prisma.$transaction(async (tx) => {
    const area = await tx.workArea.findUniqueOrThrow({ where: { name } });
    if (area.active) throw new Error("Esta área ya está activa.");
    await tx.workArea.update({ where: { name }, data: { active: true } });
    await tx.auditLog.create({
      data: {
        userId: u.id,
        entity: "WorkArea",
        entityId: name,
        action: "REACTIVAR_AREA",
        payload: { reason },
      },
    });
  });
  change();
}
export async function eliminarAreaSinUso(form: FormData) {
  const u = await requireRole("ADMIN"),
    name = field(form, "name", 3, 100),
    reason = field(form, "reason", 5, 500);
  await prisma.$transaction(
    async (tx) => {
      const area = await tx.workArea.findUniqueOrThrow({ where: { name } });
      const used = await tx.worker.count({
        where: { OR: [{ area: name }, { secondaryArea: name }] },
      });
      if (used)
        throw new Error(
          "El área tiene colaboradores actuales o históricos. No se elimina; utiliza la desactivación cuando corresponda.",
        );
      if (
        [
          "Conductor",
          "Operaciones",
          "Gerencia",
          "Mantenimiento",
          "Recursos Humanos",
          "SSOMA",
          "Salud Ocupacional",
          "Tecnología de la Información",
        ].includes(name)
      )
        throw new Error("El área institucional no puede eliminarse.");
      await tx.workArea.delete({ where: { name } });
      await tx.auditLog.create({
        data: {
          userId: u.id,
          entity: "WorkArea",
          entityId: name,
          action: "ELIMINAR_AREA_SIN_USO",
          payload: { reason, wasActive: area.active },
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  change();
}
/** Corrige fichas creadas por error, solo si no tienen cuenta ni referencias operativas. */
export async function eliminarColaboradorSinHistorial(form: FormData) {
  const u = await requireRole("ADMIN"),
    id = field(form, "id"),
    reason = field(form, "reason", 5, 500);
  await prisma.$transaction(
    async (tx) => {
      const worker = await tx.worker.findUniqueOrThrow({
        where: { id },
        select: { document: true, name: true },
      });
      if (
        await tx.user.findUnique({
          where: { workerId: id },
          select: { id: true },
        })
      )
        throw new Error(
          "El colaborador tiene una cuenta. Desactiva su ficha en lugar de eliminarla.",
        );
      // No crear eliminaciones en cascada de servicios, tareos, certificados, evidencias o expedientes.
      try {
        await tx.worker.delete({ where: { id } });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2003"
        )
          throw new Error(
            "No se puede eliminar: el colaborador tiene historial relacionado. Desactiva la ficha.",
          );
        throw e;
      }
      await tx.auditLog.create({
        data: {
          userId: u.id,
          entity: "Worker",
          entityId: id,
          action: "ELIMINAR_FICHA_ERRONEA_SIN_HISTORIAL",
          payload: { documentoUltimos4: worker.document.slice(-4), reason },
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  change();
}

/** Alta de cuenta para ficha existente: DNI, áreas y una sola contraseña inicial derivada. */
export async function crearCuentaDesdeFicha(form: FormData) {
  const actor = await requireRole("ADMIN"),
    workerId = field(form, "workerId");
  await prisma.$transaction(
    async (tx) => {
      const w = await tx.worker.findUniqueOrThrow({
        where: { id: workerId },
        select: {
          document: true,
          name: true,
          active: true,
          area: true,
          secondaryArea: true,
          user: { select: { id: true } },
        },
      });
      if (!w.active)
        throw new Error(
          "No se puede crear acceso para una ficha laboral inactiva.",
        );
      if (w.user)
        throw new Error("El colaborador ya tiene cuenta. No la dupliques.");
      const dni = dniCuentaInicial(w.document);
      if (
        await tx.user.findUnique({
          where: { login: dni },
          select: { id: true },
        })
      )
        throw new Error("Ya existe una cuenta con este DNI.");
      const roles = rolesDesdeAreas(w);
      const nuevo = await tx.user.create({
        data: {
          workerId,
          login: dni,
          displayName: w.name,
          role: roles.principal as Role,
          passwordHash: passwordHash(dni),
          mustChangePassword: false,
        },
      });
      for (const r of roles.adicionales)
        await tx.userRoleGrant.create({
          data: { userId: nuevo.id, role: r as Role, grantedBy: actor.id },
        });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          entity: "User",
          entityId: nuevo.id,
          action: "ALTA_CUENTA_DNI_DESDE_FICHA",
          payload: { workerId, roles },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  change();
}
/** Solo cuentas especiales no vinculadas a ficha laboral: ADMIN y PROPIETARIO. */
export async function crearCuenta(form: FormData) {
  const actor = await requireRole("ADMIN");
  const role = field(form, "role") as Role;
  if (role !== "ADMIN" && role !== "PROPIETARIO")
    throw new Error(
      "Las cuentas de colaboradores se crean desde su ficha laboral y áreas de trabajo.",
    );
  const password = validarClaveAsignada(
    field(form, "password", MIN_LONGITUD_CLAVE, MAX_LONGITUD_CLAVE),
    field(form, "confirmPassword", MIN_LONGITUD_CLAVE, MAX_LONGITUD_CLAVE),
  );
  const workerId = null,
    ownerId = optionalField(form, "ownerId");
  validarVinculosRol(role, workerId, ownerId);
  const login = field(form, "login", 6, 32),
    displayName = field(form, "displayName", 3, 120);
  await prisma.$transaction(
    async (tx) => {
      if (await tx.user.findUnique({ where: { login }, select: { id: true } }))
        throw new Error(
          "Ese usuario ya existe. Busca la cuenta existente en lugar de duplicarla.",
        );
      if (ownerId) {
        const owner = await tx.owner.findUnique({
          where: { id: ownerId },
          select: { id: true, contact: true },
        });
        if (!owner) throw new Error("El propietario seleccionado no existe.");
        // Compatibilidad con el alta directa desde Propietarios: ambos formularios comparten el candado.
        await tx.owner.update({
          where: { id: ownerId },
          data: { contact: owner.contact },
        });
        if (await tx.user.count({ where: { ownerId } }))
          throw new Error(
            "El propietario ya dispone de una cuenta. No se creará otra.",
          );
      }
      const a = await tx.user.create({
        data: {
          login,
          displayName,
          role,
          passwordHash: passwordHash(password),
          workerId,
          ownerId,
          mustChangePassword: false,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          entity: "User",
          entityId: a.id,
          action: "CREAR_CUENTA_ESPECIAL",
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  change();
}
/** ADMIN establece una nueva clave para otra cuenta; no ve ni recupera la anterior. */
export async function restablecerContrasena(form: FormData) {
  const actor = await requireRole("ADMIN");
  if (
    !passwordMatches(field(form, "adminPassword", 1, 256), actor.passwordHash)
  )
    throw new Error(
      "La contraseña actual de ADMIN no coincide. No se efectuó ningún cambio.",
    );
  const userId = field(form, "userId");
  const nueva = validarClaveAsignada(
    field(form, "password", MIN_LONGITUD_CLAVE, MAX_LONGITUD_CLAVE),
    field(form, "confirmPassword", MIN_LONGITUD_CLAVE, MAX_LONGITUD_CLAVE),
  );
  await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, active: true },
    });
    if (!target) throw new Error("Cuenta de usuario no encontrada.");
    await exigirNoProtegida(tx, userId);
    validarRestablecimientoAdmin(actor.id, target.id, target.active);
    await tx.user.update({
      where: { id: userId },
      data: {
        passwordHash: passwordHash(nueva),
        mustChangePassword: false,
        failedLogins: 0,
        lockedUntil: null,
      },
    });
    // La contraseña anterior no debe permitir usar sesiones ya iniciadas.
    await tx.session.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        entity: "User",
        entityId: userId,
        action: "ADMIN_REESTABLECE_CLAVE",
        payload: { sesionesRevocadas: true },
      },
    });
  });
  change();
  redirect("/dashboard/acceso?clave=actualizada");
}
/** ADMIN: modificar identificación de una cuenta sin alterar su contraseña ni vínculos. */
export async function editarCuentaAdmin(form: FormData) {
  const actor = await requireRole("ADMIN");
  if (
    !passwordMatches(field(form, "adminPassword", 1, 256), actor.passwordHash)
  )
    throw new Error("Confirma tu contraseña de ADMIN");
  const id = field(form, "userId"),
    login = field(form, "login", 6, 32),
    displayName = field(form, "displayName", 3, 120),
    reason = motivoAdmin(field(form, "reason", 10, 500));
  await prisma.$transaction(
    async (tx) => {
      const old = await tx.user.findUniqueOrThrow({
        where: { id },
        select: { id: true, login: true, displayName: true, workerId: true },
      });
      await exigirNoProtegida(tx, id);
      if (old.workerId) {
        const worker = await tx.worker.findUniqueOrThrow({
          where: { id: old.workerId },
          select: { document: true },
        });
        if (login !== worker.document)
          throw new Error(
            "El usuario del colaborador debe ser su DNI. No se puede cambiar por otro identificador.",
          );
      }
      if (old.login === login && old.displayName === displayName)
        throw new Error("No se ha cambiado ningún dato de la cuenta");
      await tx.user.update({ where: { id }, data: { login, displayName } });
      if (old.login !== login)
        await tx.session.updateMany({
          where: { userId: id },
          data: { revokedAt: new Date() },
        });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          entity: "User",
          entityId: id,
          action: "ADMIN_EDITAR_CUENTA",
          payload: {
            previous: { login: old.login, displayName: old.displayName },
            next: { login, displayName },
            reason,
            sesionesRevocadas: old.login !== login,
          },
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  change();
}
/** ADMIN: cambiar una función principal conservando otros permisos y la identidad única. */
export async function cambiarRolPrincipalAdmin(form: FormData) {
  const actor = await requireRole("ADMIN");
  if (
    !passwordMatches(field(form, "adminPassword", 1, 256), actor.passwordHash)
  )
    throw new Error("Confirma tu contraseña de ADMIN");
  const id = field(form, "userId"),
    newRole = field(form, "role"),
    reason = motivoAdmin(field(form, "reason", 10, 500));
  await prisma.$transaction(
    async (tx) => {
      const target = await tx.user.findUniqueOrThrow({ where: { id } });
      await exigirNoProtegida(tx, id);
      const adminCount = await tx.user.count({
        where: { role: "ADMIN", active: true },
      });
      const allowed = validarCambioRolPrincipal(
        actor.id,
        id,
        target.role,
        newRole,
        adminCount,
      );
      if (target.role === allowed)
        throw new Error("La cuenta ya tiene ese rol principal");
      validarVinculosRol(allowed, target.workerId, target.ownerId);
      // Evita que una función principal tenga además una autorización idéntica activa.
      await tx.userRoleGrant.updateMany({
        where: { userId: id, role: allowed, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.user.update({ where: { id }, data: { role: allowed } });
      await tx.session.updateMany({
        where: { userId: id },
        data: { revokedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          entity: "User",
          entityId: id,
          action: "ADMIN_CAMBIO_ROL_PRINCIPAL",
          payload: { previous: target.role, next: allowed, reason },
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  change();
}
/** No borrar cuentas: desactivar conserva todas sus referencias y trazabilidad. */
export async function desactivarCuenta(form: FormData) {
  const actor = await requireRole("ADMIN");
  if (
    !passwordMatches(field(form, "adminPassword", 1, 256), actor.passwordHash)
  )
    throw new Error("Confirma tu contraseña de ADMIN");
  const id = field(form, "userId"),
    reason = motivoAdmin(field(form, "reason", 10, 500));
  await prisma.$transaction(
    async (tx) => {
      const target = await tx.user.findUniqueOrThrow({ where: { id } });
      if (!target.active) throw new Error("Cuenta ya desactivada");
      await exigirNoProtegida(tx, id);
      const adminCount = await tx.user.count({
        where: { role: "ADMIN", active: true },
      });
      validarBajaAdministrativa(actor.id, id, target.role, adminCount);
      await tx.user.update({ where: { id }, data: { active: false } });
      await tx.session.updateMany({
        where: { userId: id },
        data: { revokedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          entity: "User",
          entityId: id,
          action: "ADMIN_DESACTIVAR_CUENTA",
          payload: { previous: true, next: false, reason },
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  change();
}
/** Rehabilita una cuenta administrativa sin rehabilitar automáticamente a personal inactivo. */
export async function reactivarCuentaAdmin(form: FormData) {
  const actor = await requireRole("ADMIN");
  if (
    !passwordMatches(field(form, "adminPassword", 1, 256), actor.passwordHash)
  )
    throw new Error("Confirma tu contraseña de ADMIN");
  const id = field(form, "userId"),
    reason = motivoAdmin(field(form, "reason", 10, 500));
  await prisma.$transaction(
    async (tx) => {
      const target = await tx.user.findUniqueOrThrow({
        where: { id },
        include: { worker: { select: { active: true } } },
      });
      await exigirNoProtegida(tx, id);
      validacionReactivacion(
        Boolean(target.workerId),
        target.worker?.active ?? false,
        target.active,
      );
      await tx.user.update({
        where: { id },
        data: { active: true, failedLogins: 0, lockedUntil: null },
      });
      await tx.session.updateMany({
        where: { userId: id },
        data: { revokedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          entity: "User",
          entityId: id,
          action: "ADMIN_REACTIVAR_CUENTA",
          payload: { previous: false, next: true, reason },
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  change();
}
/** Propietarios es un catálogo único; la cuenta especial se crea aparte, en la misma pantalla. */
export async function crearPropietario(form: FormData) {
  const u = await requireRole("ADMIN", "OPERACIONES", "JEFE_OPERACIONES");
  const document = field(form, "document", 6, 20)
    .toUpperCase()
    .replace(/\s+/g, "");
  const name = field(form, "name", 3, 120),
    contact = optionalField(form, "contact", 120);
  await prisma.$transaction(async (tx) => {
    if (
      await tx.owner.findUnique({ where: { document }, select: { id: true } })
    )
      throw new Error(
        "Ya existe un propietario con ese documento. Busca su ficha y vincula la unidad existente.",
      );
    const p = await tx.owner.create({ data: { document, name, contact } });
    await tx.auditLog.create({
      data: {
        userId: u.id,
        entity: "Owner",
        entityId: p.id,
        action: "CREAR_PROPIETARIO",
        payload: { document },
      },
    });
  });
  change();
}
/** Corrección auditada de la ficha; el documento legal no se edita desde este formulario simple. */
export async function actualizarPropietario(form: FormData) {
  const u = await requireRole("ADMIN", "OPERACIONES", "JEFE_OPERACIONES");
  const ownerId = field(form, "ownerId"),
    name = field(form, "name", 3, 120),
    contact = optionalField(form, "contact", 120),
    reason = field(form, "reason", 5, 500);
  await prisma.$transaction(async (tx) => {
    const old = await tx.owner.findUniqueOrThrow({
      where: { id: ownerId },
      select: { name: true, contact: true },
    });
    await tx.owner.update({ where: { id: ownerId }, data: { name, contact } });
    await tx.user.updateMany({
      where: { ownerId, role: "PROPIETARIO" },
      data: { displayName: name },
    });
    await tx.auditLog.create({
      data: {
        userId: u.id,
        entity: "Owner",
        entityId: ownerId,
        action: "ACTUALIZAR_PROPIETARIO",
        payload: { reason, anterior: old, posterior: { name, contact } },
      },
    });
  });
  change();
}
/** Vincula vehículos ya registrados; jamás modifica código ni crea otra ficha de unidad. */
export async function vincularUnidadPropietario(form: FormData) {
  const u = await requireRole("ADMIN", "OPERACIONES", "JEFE_OPERACIONES");
  const ownerId = field(form, "ownerId"),
    vehicleId = field(form, "vehicleId"),
    reason = field(form, "reason", 5, 500);
  await prisma.$transaction(
    async (tx) => {
      const owner = await tx.owner.findUnique({
        where: { id: ownerId },
        select: { id: true },
      });
      if (!owner) throw new Error("El propietario no existe.");
      const vehiculo = await tx.vehicle.findUnique({
        where: { id: vehicleId },
        select: { id: true, ownerId: true },
      });
      if (!vehiculo)
        throw new Error("Selecciona una unidad registrada en Flota.");
      permitirVinculacion(vehiculo.ownerId, ownerId);
      const changed = await tx.vehicle.updateMany({
        where: { id: vehicleId, ownerId: null },
        data: { ownerId },
      });
      if (changed.count !== 1)
        throw new Error(
          "La unidad cambió de propietario durante el registro. Recarga y verifica antes de continuar.",
        );
      await tx.auditLog.create({
        data: {
          userId: u.id,
          entity: "Vehicle",
          entityId: vehicleId,
          action: "VINCULAR_PROPIETARIO",
          payload: { ownerId, reason },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  change();
}
export async function desvincularUnidadPropietario(form: FormData) {
  const u = await requireRole("ADMIN", "OPERACIONES", "JEFE_OPERACIONES");
  const ownerId = field(form, "ownerId"),
    vehicleId = field(form, "vehicleId"),
    reason = field(form, "reason", 5, 500);
  await prisma.$transaction(
    async (tx) => {
      const result = await tx.vehicle.updateMany({
        where: { id: vehicleId, ownerId },
        data: { ownerId: null },
      });
      if (result.count !== 1)
        throw new Error(
          "La unidad no está vinculada a este propietario. Comprueba su ficha.",
        );
      await tx.auditLog.create({
        data: {
          userId: u.id,
          entity: "Vehicle",
          entityId: vehicleId,
          action: "DESVINCULAR_PROPIETARIO",
          payload: { ownerId, reason },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  change();
}
export async function crearVehiculo(form: FormData) {
  const u = await requireRole("ADMIN", "OPERACIONES", "JEFE_OPERACIONES");
  const ownerId = optionalField(form, "ownerId");
  const v = await prisma.vehicle.create({
    data: {
      code: field(form, "code", 2, 30),
      plate: field(form, "plate", 5, 12).toUpperCase(),
      type: validarTipoUnidadKCJ(field(form, "type", 3, 50)),
      make: optionalField(form, "make"),
      model: optionalField(form, "model"),
      year: form.get("year")
        ? enteroOperativo(numberField(form, "year", 1980, 2100), 1980, 2100)
        : null,
      color: optionalField(form, "color", 50),
      vin: optionalField(form, "vin", 50),
      engineNumber: optionalField(form, "engineNumber", 50),
      mineCode: optionalField(form, "mineCode", 50),
      ownerId,
    },
  });
  await log(u.id, "Vehicle", v.id, "CREAR");
  change();
}
export async function registrarDocumento(form: FormData) {
  const u = await requireRole("ADMIN", "OPERACIONES", "JEFE_OPERACIONES");
  const kind = field(form, "kind"),
    vehicleId = field(form, "vehicleId"),
    evidenceKey = optionalField(form, "evidenceKey", 400);
  if (!documentoGeneralValido(kind))
    throw new Error(
      "Documento no incluido en el catálogo vehicular general de KCJ.",
    );
  if (
    !(await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true },
    }))
  )
    throw new Error("Unidad no registrada en Flota.");
  if (flag(form, "verified") && !evidenceKey)
    throw new Error("Para validar el documento se requiere evidencia.");
  if (evidenceKey) await requireEvidence(evidenceKey, "FLOTA");
  const expiresAt = optionalDate(form, "expiresAt");
  if (["SOAT", "REVISION_TECNICA", "POLIZA"].includes(kind) && !expiresAt)
    throw new Error("Este documento requiere fecha de vencimiento.");
  const d = await prisma.vehicleDocument.create({
    data: {
      vehicleId,
      kind,
      expiresAt,
      reference: optionalField(form, "reference"),
      evidenceKey,
      verifiedAt: flag(form, "verified") ? new Date() : null,
    },
  });
  await log(u.id, "VehicleDocument", d.id, "REGISTRAR_VERSION");
  change();
}
export async function registrarOdometro(form: FormData) {
  const u = await requireRole(
    "ADMIN",
    "OPERACIONES",
    "MANTENIMIENTO",
    "JEFE_OPERACIONES",
  );
  const vehicleId = field(form, "vehicleId");
  const kilometers = enteroOperativo(
    numberField(form, "kilometers", 0, 10000000),
    0,
    10000000,
  );
  const last = await prisma.odometerReading.findFirst({
    where: { vehicleId },
    orderBy: { at: "desc" },
  });
  if (last && kilometers < last.kilometers)
    throw new Error(
      "Odómetro menor al anterior: requiere revisión antes de registrar",
    );
  await requireEvidence(field(form, "evidenceKey", 8, 400), "FLOTA");
  const r = await prisma.odometerReading.create({
    data: {
      vehicleId,
      kilometers,
      evidenceKey: optionalField(form, "evidenceKey", 400),
    },
  });
  await log(u.id, "OdometerReading", r.id, "REGISTRAR");
  change();
}
export async function crearMantenimiento(form: FormData) {
  const u = await requireRole("MANTENIMIENTO", "ADMIN");
  const o = await prisma.workOrder.create({
    data: {
      vehicleId: field(form, "vehicleId"),
      issue: field(form, "issue", 5, 1000),
      critical: flag(form, "critical"),
    },
  });
  await log(u.id, "WorkOrder", o.id, "ABRIR");
  change();
}
export async function liberarMantenimiento(form: FormData) {
  const u = await requireRole("MANTENIMIENTO");
  const id = field(form, "id");
  const evidenceKey = field(form, "evidenceKey", 8, 400);
  await requireEvidence(evidenceKey, "MANTENIMIENTO");
  await prisma.$transaction(async (tx) => {
    const row = await tx.workOrder.findUniqueOrThrow({ where: { id } });
    if (row.status === "LIBERADA") throw new Error("Orden ya liberada");
    await tx.workOrder.update({
      where: { id },
      data: {
        status: "LIBERADA",
        releasedAt: new Date(),
        releasedBy: u.id,
        evidenceKey,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: u.id,
        entity: "WorkOrder",
        entityId: id,
        action: "LIBERACION_TECNICA",
        payload: { evidenceKey },
      },
    });
  });
  change();
}
/** Certificaciones externas de PERSONAS. Nunca recibe vehicleId ni Tarjeta Amarilla. */
export async function registrarHomologacionPersonal(form: FormData) {
  const u = await requireRole(
    "ADMIN",
    "OPERACIONES",
    "JEFE_OPERACIONES",
    "HOMOLOGACION",
  );
  const workerId = field(form, "workerId"),
    kind = field(form, "kind"),
    evidenceKey = optionalField(form, "evidenceKey", 400);
  validarHomologacionPersonal(kind, workerId, optionalField(form, "vehicleId"));
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    select: { active: true },
  });
  if (!worker?.active)
    throw new Error("Selecciona un colaborador activo registrado en KCJ.");
  if (flag(form, "verified") && !evidenceKey)
    throw new Error(
      "Se requiere evidencia documental para verificar un resultado externo.",
    );
  if (evidenceKey) await requireEvidence(evidenceKey, "HOMOLOGACION");
  const issuedAt = optionalDate(form, "issuedAt"),
    validUntil = instant(form, "validUntil");
  if (issuedAt && issuedAt > validUntil)
    throw new Error("El vencimiento no puede ser anterior a la emisión.");
  const c = await prisma.clearance.create({
    data: {
      workerId,
      vehicleId: null,
      kind,
      scope: field(form, "scope"),
      reference: optionalField(form, "reference", 120),
      issuedAt,
      validUntil,
      verified: flag(form, "verified"),
      evidenceKey,
    },
  });
  await log(u.id, "Clearance", c.id, "REGISTRAR_HOMOLOGACION_PERSONAL_EXTERNA");
  change();
}
/** Compatibilidad: impedir que código antiguo cree certificaciones mixtas. */
export async function crearHabilitacion(form: FormData) {
  const kind = field(form, "kind");
  if (kind === "TARJETA_AMARILLA")
    throw new Error(
      "El pase minero se registra desde Flota → Ficha de unidad → Habilitación minera.",
    );
  return registrarHomologacionPersonal(form);
}
export async function registrarAptitud(form: FormData) {
  const u = await requireRole("SALUD");
  const status = field(form, "status") as
    | "APTO"
    | "RESTRINGIDO"
    | "NO_APTO"
    | "PENDIENTE";
  if (!["APTO", "RESTRINGIDO", "NO_APTO", "PENDIENTE"].includes(status))
    throw new Error("Estado inválido");
  const workerId = field(form, "workerId");
  const v = await prisma.medicalFitness.upsert({
    where: { workerId },
    create: {
      workerId,
      status,
      validUntil: instant(form, "validUntil"),
      reviewedBy: u.id,
    },
    update: {
      status,
      validUntil: instant(form, "validUntil"),
      reviewedBy: u.id,
      reviewedAt: new Date(),
    },
  });
  await log(u.id, "MedicalFitness", v.id, "ACTUALIZAR_APTITUD", {
    status,
    validUntil: v.validUntil.toISOString(),
  });
  change();
}
export async function crearRoster(form: FormData) {
  const u = await requireRole("OPERACIONES", "JEFE_OPERACIONES"),
    workerId = field(form, "workerId");
  const startsAt = instant(form, "startsAt"),
    endsAt = instant(form, "endsAt");
  if (!validInterval({ startsAt, endsAt }))
    throw new Error("Intervalo incorrecto");
  const kind = field(form, "kind");
  if (kind !== "GUARDIA" && kind !== "DESCANSO")
    throw new Error("Tipo de jornada no válido");
  await prisma.$transaction(
    async (tx) => {
      const worker = await tx.worker.findUnique({
        where: { id: workerId },
        select: { active: true },
      });
      if (!worker?.active)
        throw new Error(
          "El colaborador debe estar activo para programar una guardia",
        );
      const same = await tx.roster.findMany({
        where: { workerId, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
      });
      if (same.some((x) => overlaps({ startsAt, endsAt }, x)))
        throw new Error(
          "Cruce de horarios: este colaborador ya tiene una guardia o descanso durante el período seleccionado. Consulta el ROSTER y corrige las fechas",
        );
      const r = await tx.roster.create({
        data: { workerId, startsAt, endsAt, kind, createdBy: u.id },
      });
      await tx.auditLog.create({
        data: {
          userId: u.id,
          entity: "Roster",
          entityId: r.id,
          action: "BORRADOR",
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  change();
}
export async function publicarRoster(form: FormData) {
  const u = await requireRole("JEFE_OPERACIONES"),
    id = field(form, "id");
  await prisma.$transaction(
    async (tx) => {
      const r = await tx.roster.findUniqueOrThrow({ where: { id } });
      if (r.status !== "BORRADOR")
        throw new Error("El ROSTER ya fue publicado o no está en borrador");
      const others = await tx.roster.findMany({
        where: {
          workerId: r.workerId,
          status: "PUBLICADO",
          id: { not: id },
          startsAt: { lt: r.endsAt },
          endsAt: { gt: r.startsAt },
        },
      });
      if (
        others.some((x) =>
          overlaps({ startsAt: r.startsAt, endsAt: r.endsAt }, x),
        )
      )
        throw new Error(
          "Cruce de horarios con un ROSTER ya publicado: revisa la programación antes de aprobar",
        );
      await tx.roster.update({
        where: { id, status: "BORRADOR" },
        data: {
          status: "PUBLICADO",
          publishedBy: u.id,
          publishedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          userId: u.id,
          entity: "Roster",
          entityId: id,
          action: "PUBLICAR",
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  change();
}
export async function crearServicio(form: FormData) {
  const u = await requireRole("OPERACIONES", "JEFE_OPERACIONES");
  const startsAt = instant(form, "startsAt"),
    endsAt = instant(form, "endsAt");
  if (!validInterval({ startsAt, endsAt })) throw new Error("Horas inválidas");
  const s = await prisma.service.create({
    data: {
      code: field(form, "code", 3, 40),
      customer: field(form, "customer", 2, 120),
      route: field(form, "route", 3, 300),
      startsAt,
      endsAt,
      mineRequired: flag(form, "mineRequired"),
      mineScope: flag(form, "mineRequired")
        ? field(form, "mineScope", 3, 120)
        : null,
    },
  });
  await log(u.id, "Service", s.id, "CREAR");
  change();
}
export async function asignarServicio(form: FormData) {
  const u = await requireRole("OPERACIONES", "JEFE_OPERACIONES");
  const id = field(form, "id"),
    workerId = field(form, "workerId"),
    vehicleId = field(form, "vehicleId");
  await prisma.$transaction(
    async (tx) => {
      const s = await tx.service.findUniqueOrThrow({ where: { id } });
      if (s.status !== "PLANIFICADO")
        throw new Error("Solo se asignan servicios planificados");
      const reasons = await comprobarAsignacion(
        workerId,
        vehicleId,
        s.startsAt,
        s.endsAt,
        s.mineRequired,
        id,
        s.mineScope,
        tx,
      );
      if (reasons.length)
        throw new Error(`Asignación bloqueada: ${reasons.join("; ")}`);
      await tx.service.update({
        where: { id, status: "PLANIFICADO" },
        data: { workerId, vehicleId, status: "ASIGNADO" },
      });
      await tx.auditLog.create({
        data: {
          userId: u.id,
          entity: "Service",
          entityId: id,
          action: "ASIGNAR",
          payload: { workerId, vehicleId },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  change();
}
export async function iniciarServicio(form: FormData) {
  const u = await requireUser(),
    panel = await panelActual(u);
  const id = field(form, "serviceId"),
    clientEventId = field(form, "clientEventId", 8, 100);
  if (!panel)
    throw new Error(
      "Selecciona tu panel de trabajo antes de iniciar un servicio",
    );
  await prisma.$transaction(
    async (tx) => {
      const s = await tx.service.findUniqueOrThrow({ where: { id } });
      // La validación admite paneles administrativos y de conductor; los paneles por área
      // se verifican mediante el permiso operativo real del usuario.
      const panelServicio: "administrativo" | "conductor" =
        panel === "conductor" ? "conductor" : "administrativo";
      autorizarOperacionServicio(
        panelServicio,
        u.workerId,
        s.workerId,
        tieneRol(u, "OPERACIONES", "JEFE_OPERACIONES"),
      );
      const exists = await tx.serviceEvent.findUnique({
        where: { clientEventId },
      });
      if (exists) {
        if (exists.serviceId !== id || exists.type !== "INICIO")
          throw new Error("ID de evento duplicado");
        return;
      }
      if (s.status !== "ASIGNADO" || !s.workerId || !s.vehicleId)
        throw new Error("Servicio sin conductor o unidad asignados");
      // Entre asignación e inicio pueden vencer permisos, cambiar guardias o abrirse fallas críticas.
      const reasons = await comprobarAsignacion(
        s.workerId,
        s.vehicleId,
        s.startsAt,
        s.endsAt,
        s.mineRequired,
        id,
        s.mineScope,
        tx,
      );
      if (reasons.length)
        throw new Error(
          `No se puede iniciar el servicio: ${reasons.join("; ")}`,
        );
      await tx.service.update({
        where: { id, status: "ASIGNADO" },
        data: { status: "EN_CURSO", startedAt: new Date() },
      });
      await tx.serviceEvent.create({
        data: {
          serviceId: id,
          clientEventId,
          type: "INICIO",
          occurredAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          userId: u.id,
          entity: "Service",
          entityId: id,
          action: "INICIO",
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  change();
}
export async function crearTareo(form: FormData) {
  const u = await requireRole("OPERACIONES", "JEFE_OPERACIONES", "ADMIN");
  const workerId = field(form, "workerId"),
    startsAt = instant(form, "startsAt"),
    endsAt = instant(form, "endsAt");
  const hours = hoursBetween(startsAt, endsAt),
    source = validarOrigenTareo(field(form, "origin"));
  if (endsAt.getTime() > Date.now())
    throw new Error(
      "No se puede registrar tiempo de trabajo que todavía no ha transcurrido",
    );
  const serviceId = source === "SERVICIO" ? field(form, "serviceId") : null;
  const reason =
    source === "REGISTRO_INTERNO"
      ? motivoRegistroInterno(optionalField(form, "reason", 500))
      : null;
  await prisma.$transaction(
    async (tx) => {
      const worker = await tx.worker.findUnique({
        where: { id: workerId },
        select: { id: true, area: true, secondaryArea: true, active: true },
      });
      if (!worker || !worker.active)
        throw new Error("Colaborador inexistente o inactivo");
      const areaAtEntry = optionalField(form, "areaAtEntry") ?? worker.area;
      if (areaAtEntry !== worker.area && areaAtEntry !== worker.secondaryArea)
        throw new Error(
          "El colaborador no tiene asignada el área laboral indicada para este tareo.",
        );
      if (source === "SERVICIO") {
        const servicio = await tx.service.findUnique({
          where: { id: serviceId! },
        });
        if (!servicio) throw new Error("Servicio de origen inexistente");
        validarVinculoServicioTareo({ workerId, servicio, startsAt, endsAt });
      }
      const exists = await tx.timesheet.findFirst({
        where: {
          workerId,
          status: { not: "OBSERVADO" },
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
      });
      if (exists) throw new Error("Tareo solapado o duplicado");
      const t = await tx.timesheet.create({
        data: {
          workerId,
          serviceId,
          startsAt,
          endsAt,
          hours,
          source,
          areaAtEntry,
          reason,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: u.id,
          entity: "Timesheet",
          entityId: t.id,
          action: "REGISTRAR",
          payload: {
            areaObtenidaDeFicha: areaAtEntry,
            origen: source,
            serviceId,
            horas: hours,
            motivo: reason,
          },
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  change();
}
export async function validarTareo(form: FormData) {
  const u = await requireRole("RRHH");
  const id = field(form, "id");
  await prisma.$transaction(async (tx) => {
    await tx.timesheet.update({
      where: { id, status: "PENDIENTE" },
      data: { status: "VALIDADO", reviewerId: u.id },
    });
    await tx.auditLog.create({
      data: {
        userId: u.id,
        entity: "Timesheet",
        entityId: id,
        action: "VALIDAR",
      },
    });
  });
  change();
}
export async function registrarContrato(form: FormData) {
  const u = await requireRole("RRHH");
  const key = optionalField(form, "evidenceKey", 400);
  if (key) await requireEvidence(key, "RRHH");
  const c = await prisma.contract.create({
    data: {
      workerId: field(form, "workerId"),
      kind: field(form, "kind", 3, 100),
      startsAt: instant(form, "startsAt"),
      endsAt: optionalDate(form, "endsAt"),
      evidenceKey: optionalField(form, "evidenceKey", 400),
    },
  });
  await log(u.id, "Contract", c.id, "REGISTRAR");
  change();
}
/** La captura antigua sin inventario queda bloqueada para evitar actas incompletas. */
export async function registrarCustodia(_form: FormData): Promise<void> {
  await requireRole("OPERACIONES", "JEFE_OPERACIONES", "ADMIN");
  throw new Error(
    "Registra las actas desde la ficha de Entrega y recepción de la unidad, con inventario comparativo",
  );
}

export async function crearCaso(form: FormData) {
  const u = await requireRole(
      "SSOMA",
      "OPERACIONES",
      "JEFE_OPERACIONES",
      "CONDUCTOR",
    ),
    panel = await panelActual(u);
  const v = optionalField(form, "vehicleId"),
    w = optionalField(form, "workerId");
  if (panel === "conductor" && (!u.workerId || w !== u.workerId))
    throw new Error("El conductor solo reporta su propio caso");
  const evidenceKey = optionalField(form, "evidenceKey", 400);
  if (evidenceKey)
    await requireEvidenceOwnedAny(evidenceKey, ["CONNECT", "SSOMA"], u.id);
  const category = field(form, "category");
  if (
    ![
      "Incidente",
      "Accidente",
      "Condición insegura",
      "Inspección",
      "IPERC",
      "Observación",
    ].includes(category)
  )
    throw new Error("Categoría no válida");
  const c = await prisma.safetyCase.create({
    data: {
      evidenceKey,
      reference: `SSO-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      category,
      severity: severidadSSOMA(field(form, "severity")),
      title: field(form, "title", 5, 150),
      details: field(form, "details", 10, 3000),
      workerId: w,
      vehicleId: v,
    },
  });
  await log(u.id, "SafetyCase", c.id, "REPORTAR");
  change();
}
export async function agregarAccion(form: FormData) {
  const u = await requireRole("SSOMA");
  const caseId = field(form, "caseId");
  const c = await prisma.safetyCase.findUniqueOrThrow({
    where: { id: caseId },
  });
  if (c.status === "CERRADO") throw new Error("Caso cerrado");
  const a = await prisma.safetyAction.create({
    data: {
      caseId,
      description: field(form, "description", 5, 1000),
      responsible: field(form, "responsible", 3, 150),
      dueAt: instant(form, "dueAt"),
    },
  });
  await log(u.id, "SafetyAction", a.id, "CREAR");
  change();
}
export async function verificarAccion(form: FormData) {
  const u = await requireRole("SSOMA");
  const id = field(form, "id"),
    evidenceKey = field(form, "evidenceKey", 8, 400);
  await requireEvidence(evidenceKey, ["SSOMA", "CONNECT"]);
  await prisma.$transaction(async (tx) => {
    const a = await tx.safetyAction.findUniqueOrThrow({ where: { id } });
    if (a.status === "VERIFICADA") throw new Error("Acción ya verificada");
    await tx.safetyAction.update({
      where: { id },
      data: {
        status: "VERIFICADA",
        evidenceKey,
        verifiedBy: u.id,
        verifiedAt: new Date(),
      },
    });
    await tx.auditLog.create({
      data: {
        userId: u.id,
        entity: "SafetyAction",
        entityId: id,
        action: "VERIFICAR",
        payload: { evidenceKey },
      },
    });
  });
  change();
}
export async function cerrarCaso(form: FormData) {
  const u = await requireRole("SSOMA");
  const id = field(form, "id");
  const closureReason = optionalField(form, "closureReason", 1000) ?? "";
  await prisma.$transaction(async (tx) => {
    const c = await tx.safetyCase.findUniqueOrThrow({
      where: { id },
      include: { actions: true },
    });
    if (c.status === "CERRADO") throw new Error("Ya está cerrado");
    if (!mayCloseSafetyCase(c.actions, closureReason))
      throw new Error(
        "Existen acciones sin evidencia/verificación o falta justificación técnica",
      );
    await tx.safetyCase.update({
      where: { id },
      data: {
        status: "CERRADO",
        closureReason,
        closedAt: new Date(),
        closedBy: u.id,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: u.id,
        entity: "SafetyCase",
        entityId: id,
        action: "CERRAR",
        payload: { closureReason },
      },
    });
  });
  change();
}
export async function reabrirCaso(form: FormData) {
  const u = await requireRole("SSOMA");
  const id = field(form, "id"),
    reason = field(form, "reason", 12, 1000);
  await prisma.$transaction(async (tx) => {
    const c = await tx.safetyCase.findUniqueOrThrow({ where: { id } });
    if (c.status !== "CERRADO")
      throw new Error("Solo se reabren casos cerrados");
    await tx.safetyCase.update({
      where: { id },
      data: {
        status: "ABIERTO",
        closureReason: null,
        closedAt: null,
        closedBy: null,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: u.id,
        entity: "SafetyCase",
        entityId: id,
        action: "REABRIR",
        payload: {
          reason,
          previousClosure: c.closureReason,
          previousClosedAt: c.closedAt?.toISOString(),
        },
      },
    });
  });
  change();
}
export async function crearInventario(form: FormData) {
  const u = await requireRole(
    "ALMACEN",
    "ADMIN",
    "OPERACIONES",
    "JEFE_OPERACIONES",
  );
  const i = await prisma.inventoryItem.create({
    data: {
      sku: field(form, "sku", 2, 40),
      name: field(form, "name", 3, 150),
      unit: validarUnidadMedidaKCJ(field(form, "unit", 1, 30)),
    },
  });
  await log(u.id, "InventoryItem", i.id, "CREAR");
  change();
}
export async function moverInventario(form: FormData) {
  const u = await requireRole("ALMACEN", "OPERACIONES", "JEFE_OPERACIONES");
  const itemId = field(form, "itemId");
  const delta = deltaInventario(
    field(form, "direction"),
    numberField(form, "quantity", 1, 100000),
  );
  const reason = field(form, "reason", 5, 500);
  await prisma.$transaction(async (tx) => {
    const current = await tx.inventoryItem.findUniqueOrThrow({
      where: { id: itemId },
    });
    if (current.quantity + delta < 0)
      throw new Error("Inventario insuficiente");
    const updated = await tx.inventoryItem.updateMany({
      where: { id: itemId, quantity: current.quantity },
      data: { quantity: { increment: delta } },
    });
    if (updated.count !== 1)
      throw new Error("Stock modificado por otro usuario. Vuelva a intentar");
    const m = await tx.stockMovement.create({
      data: { itemId, delta, reason, actorId: u.id },
    });
    await tx.auditLog.create({
      data: {
        userId: u.id,
        entity: "StockMovement",
        entityId: m.id,
        action: delta < 0 ? "SALIDA" : "INGRESO",
        payload: { delta, reason },
      },
    });
  });
  change();
}
export async function finalizarServicio(form: FormData) {
  const u = await requireUser(),
    panel = await panelActual(u);
  const id = field(form, "id"),
    clientEventId = field(form, "clientEventId", 8, 100);
  if (!panel)
    throw new Error(
      "Selecciona tu panel de trabajo antes de finalizar un servicio",
    );
  await prisma.$transaction(
    async (tx) => {
      const s = await tx.service.findUniqueOrThrow({ where: { id } });
      // La validación admite paneles administrativos y de conductor; los paneles por área
      // se verifican mediante el permiso operativo real del usuario.
      const panelServicio: "administrativo" | "conductor" =
        panel === "conductor" ? "conductor" : "administrativo";
      autorizarOperacionServicio(
        panelServicio,
        u.workerId,
        s.workerId,
        tieneRol(u, "OPERACIONES", "JEFE_OPERACIONES"),
      );
      const old = await tx.serviceEvent.findUnique({
        where: { clientEventId },
      });
      if (old) {
        if (old.serviceId !== id || old.type !== "FINALIZACION")
          throw new Error("Evento en conflicto");
        return;
      }
      if (s.status !== "EN_CURSO")
        throw new Error("Servicio no iniciado o ya finalizado");
      await tx.service.update({
        where: { id, status: "EN_CURSO" },
        data: { status: "FINALIZADO", endedAt: new Date() },
      });
      await tx.serviceEvent.create({
        data: {
          serviceId: id,
          clientEventId,
          type: "FINALIZACION",
          occurredAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          userId: u.id,
          entity: "Service",
          entityId: id,
          action: "FINALIZAR",
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  change();
}
export async function cambiarUnidad(form: FormData) {
  const u = await requireRole("OPERACIONES", "JEFE_OPERACIONES");
  const id = field(form, "id"),
    vehicleId = field(form, "vehicleId"),
    reason = field(form, "reason", 12, 1000);
  await prisma.$transaction(
    async (tx) => {
      const s = await tx.service.findUniqueOrThrow({ where: { id } });
      if (!s.workerId || !s.vehicleId || s.status !== "EN_CURSO")
        throw new Error("Servicio no está en curso con conductor y unidad");
      if (s.vehicleId === vehicleId)
        throw new Error("Debe indicar otra unidad");
      const reasons = await comprobarAsignacion(
        s.workerId,
        vehicleId,
        s.startsAt,
        s.endsAt,
        s.mineRequired,
        id,
        s.mineScope,
        tx,
      );
      if (reasons.length)
        throw new Error(`Cambio no permitido: ${reasons.join("; ")}`);
      await tx.service.update({
        where: { id, status: "EN_CURSO" },
        data: { vehicleId },
      });
      await tx.serviceEvent.create({
        data: {
          serviceId: id,
          clientEventId: randomUUID(),
          type: "CAMBIO_UNIDAD",
          description: reason,
          occurredAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          userId: u.id,
          entity: "Service",
          entityId: id,
          action: "CAMBIO_UNIDAD",
          payload: { anterior: s.vehicleId, nueva: vehicleId, reason },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  change();
}
/** Teléfono y licencia pertenecen a cualquier colaborador, no solo al área Conductor. */
export async function actualizarDatosContactoLicencia(form: FormData) {
  const u = await requireRole("RRHH", "ADMIN");
  const id = field(form, "id"),
    reason = field(form, "reason", 5, 500);
  const phone = validarContactoCelular(optionalField(form, "phone", 22));
  const license = optionalField(form, "license", 50),
    licenseCategory = optionalField(form, "licenseCategory", 24);
  const licenseIssuedAt = optionalDate(form, "licenseIssuedAt"),
    licenseExpires = optionalDate(form, "licenseExpires");
  validarLicenciaColaborador(
    license,
    licenseCategory,
    licenseExpires,
    licenseIssuedAt,
  );
  const antes = await prisma.worker.findUniqueOrThrow({
    where: { id },
    select: {
      phone: true,
      license: true,
      licenseCategory: true,
      licenseIssuedAt: true,
      licenseExpires: true,
    },
  });
  const cambios = {
    phone,
    license,
    licenseCategory,
    licenseIssuedAt,
    licenseExpires,
  };
  if (
    Object.entries(cambios).every(([k, v]) => {
      const original = antes[k as keyof typeof antes];
      return v instanceof Date && original instanceof Date
        ? v.getTime() === original.getTime()
        : v === original;
    })
  )
    throw new Error("No se detectaron cambios de contacto o licencia.");
  await prisma.$transaction(async (tx) => {
    await tx.worker.update({ where: { id }, data: cambios });
    await tx.auditLog.create({
      data: {
        userId: u.id,
        entity: "Worker",
        entityId: id,
        action: "ACTUALIZAR_CONTACTO_Y_LICENCIA",
        payload: { reason, campos: Object.keys(cambios) },
      },
    });
  });
  change();
  redirect(`/dashboard/ficha-colaborador/${encodeURIComponent(id)}`);
}

export async function actualizarTrabajador(form: FormData) {
  const u = await requireRole("RRHH", "ADMIN");
  const id = field(form, "id");
  const status = field(form, "status");
  if (status !== "ACTIVO" && status !== "INACTIVO")
    throw new Error("Estado laboral inválido.");
  const active = status === "ACTIVO";
  const reason = field(form, "reason", 5, 500);
  await prisma.$transaction(
    async (tx) => {
      const before = await tx.worker.findUniqueOrThrow({ where: { id } });
      const catalog = await tx.workArea.findMany({
        where: { active: true },
        select: { name: true },
      });
      // Se admiten áreas históricas del mismo colaborador aunque luego cambie el catálogo.
      const available = [
        ...new Set([
          ...catalog.map((x) => x.name),
          before.area,
          ...(before.secondaryArea ? [before.secondaryArea] : []),
        ]),
      ];
      const areas = validarAreasTrabajo(
        field(form, "area", 2, 100),
        optionalField(form, "secondaryArea"),
        available,
      );
      if (
        before.area === areas.area &&
        before.secondaryArea === areas.secondaryArea &&
        before.active === active
      )
        throw new Error("No se detectaron cambios en la ficha.");
      const accAntes = await tx.user.findUnique({
        where: { workerId: id },
        select: {
          id: true,
          role: true,
          active: true,
          grants: { where: { revokedAt: null }, select: { role: true } },
        },
      });
      if (accAntes) await exigirNoProtegida(tx, accAntes.id);
      const oldDerived = rolesDesdeAreas(before);
      const newDerived = rolesDesdeAreas(areas);
      await tx.worker.update({ where: { id }, data: { ...areas, active } });
      if (accAntes) {
        const rolePrincipalAutomatico = accAntes.role === oldDerived.principal;
        const mainRole = rolePrincipalAutomatico
          ? newDerived.principal
          : accAntes.role;
        if (rolePrincipalAutomatico && accAntes.role !== mainRole) {
          await tx.user.update({
            where: { id: accAntes.id },
            data: { role: mainRole as Role },
          });
        }
        // Conservar privilegios concedidos manualmente, pero retirar los derivados de un área ya retirada.
        const derivedBefore = new Set(oldDerived.adicionales);
        const derivedAfter = new Set([
          ...newDerived.adicionales,
          ...(mainRole !== newDerived.principal ? [newDerived.principal] : []),
        ]);
        for (const role of derivedBefore) {
          if (!derivedAfter.has(role) && role !== mainRole)
            await tx.userRoleGrant.updateMany({
              where: {
                userId: accAntes.id,
                role: role as Role,
                revokedAt: null,
              },
              data: { revokedAt: new Date() },
            });
        }
        if (active) {
          for (const role of derivedAfter) {
            if (role === mainRole) continue;
            await tx.userRoleGrant.upsert({
              where: {
                userId_role: { userId: accAntes.id, role: role as Role },
              },
              create: {
                userId: accAntes.id,
                role: role as Role,
                grantedBy: u.id,
              },
              update: {
                revokedAt: null,
                grantedAt: new Date(),
                grantedBy: u.id,
              },
            });
          }
          if (!accAntes.active) {
            if (accAntes.role === "ADMIN" && u.role !== "ADMIN")
              throw new Error(
                "Solo ADMIN puede reactivar una cuenta administradora.",
              );
            await tx.user.update({
              where: { id: accAntes.id },
              data: { active: true },
            });
          }
        }
        // Se revalida la autorización de cada panel a partir de la próxima sesión.
        await tx.session.updateMany({
          where: { userId: accAntes.id },
          data: { revokedAt: new Date() },
        });
      }
      if (!active) {
        const acc = await tx.user.findUnique({ where: { workerId: id } });
        if (acc) {
          if (acc.role === "ADMIN") {
            const activos = await tx.user.count({
              where: { role: "ADMIN", active: true },
            });
            validarBajaAdministrativa(u.id, acc.id, acc.role, activos);
          }
          await tx.user.update({
            where: { id: acc.id },
            data: { active: false },
          });
          await tx.session.updateMany({
            where: { userId: acc.id },
            data: { revokedAt: new Date() },
          });
        }
      }
      await tx.auditLog.create({
        data: {
          userId: u.id,
          entity: "Worker",
          entityId: id,
          action: "ACTUALIZAR_AREAS_ESTADO",
          payload: {
            previous: {
              areaPrincipal: before.area,
              areaSecundaria: before.secondaryArea,
              active: before.active,
            },
            next: {
              areaPrincipal: areas.area,
              areaSecundaria: areas.secondaryArea,
              active,
            },
            reason,
          },
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  change();
}

export async function otorgarRol(form: FormData) {
  const actor = await requireRole("ADMIN");
  const userId = field(form, "userId");
  const role = field(form, "role") as Role;
  const reason = field(form, "reason", 10, 300);
  const allowed: Role[] = [
    "GERENCIA",
    "OPERACIONES",
    "JEFE_OPERACIONES",
    "SSOMA",
    "MANTENIMIENTO",
    "RRHH",
    "SALUD",
    "HOMOLOGACION",
    "INSTRUCTOR",
    "ALMACEN",
    "CONDUCTOR",
  ];
  if (!allowed.includes(role))
    throw new Error(
      "Solo se pueden añadir funciones autorizadas; propietario vehicular requiere su vínculo independiente.",
    );
  await prisma.$transaction(async (tx) => {
    await exigirNoProtegida(tx, userId);
    const target = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (!target.active) throw new Error("Cuenta inactiva");
    if (target.role === role)
      throw new Error("La cuenta ya tiene ese rol principal");
    if (role === "CONDUCTOR" && !target.workerId)
      throw new Error(
        "Para asignar Conductor, primero vincule la cuenta con una ficha laboral única.",
      );
    if (role === "CONDUCTOR") {
      const ficha = await tx.worker.findUniqueOrThrow({
        where: { id: target.workerId! },
        select: { area: true, secondaryArea: true },
      });
      validarRolConductorEnFicha(role, ficha);
    }
    await tx.userRoleGrant.upsert({
      where: { userId_role: { userId, role } },
      create: { userId, role, grantedBy: actor.id },
      update: { grantedBy: actor.id, grantedAt: new Date(), revokedAt: null },
    });
    await tx.session.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        entity: "User",
        entityId: userId,
        action: "AUTORIZAR_FUNCION",
        payload: { role, reason },
      },
    });
  });
  change();
}
export async function revocarRol(form: FormData) {
  const actor = await requireRole("ADMIN");
  const userId = field(form, "userId");
  const role = field(form, "role") as Role;
  const reason = field(form, "reason", 10, 300);
  await prisma.$transaction(async (tx) => {
    await exigirNoProtegida(tx, userId);
    const target = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (target.role === role)
      throw new Error("No se puede revocar el rol principal aquí");
    const changed = await tx.userRoleGrant.updateMany({
      where: { userId, role, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (!changed.count)
      throw new Error("La función no estaba activa para esta cuenta");
    await tx.session.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        entity: "User",
        entityId: userId,
        action: "REVOCAR_FUNCION",
        payload: { role, reason },
      },
    });
  });
  change();
}

/** Una recepción administrativa no habilita una unidad: faltan ambas conformidades. */
export async function verificarRecepcionTecnica(form: FormData) {
  const u = await requireRole("MANTENIMIENTO");
  const id = field(form, "id");
  await prisma.$transaction(async (tx) => {
    const e = await tx.custodyEvent.findUniqueOrThrow({ where: { id } });
    const last = await tx.custodyEvent.findFirst({
      where: { vehicleId: e.vehicleId },
      orderBy: { at: "desc" },
    });
    if (last?.id !== id || e.kind !== "RECEPCION")
      throw new Error("La recepción no es el evento vigente");
    if (e.technicalVerifiedAt)
      throw new Error("Recepción ya validada técnicamente");
    const unresolved = await tx.custodyInventoryLine.count({
      where: { custodyEventId: id, discrepancy: true, resolvedAt: null },
    });
    if (unresolved > 0)
      throw new Error(
        "Hay diferencias de inventario sin resolución documentada",
      );
    const critical = await tx.workOrder.count({
      where: { vehicleId: e.vehicleId, status: { not: "LIBERADA" } },
    });
    if (critical)
      throw new Error("Existen órdenes de mantenimiento sin liberar");
    await tx.custodyEvent.update({
      where: { id },
      data: { technicalVerifiedAt: new Date(), technicalVerifiedBy: u.id },
    });
    await tx.auditLog.create({
      data: {
        userId: u.id,
        entity: "CustodyEvent",
        entityId: id,
        action: "REVISION_TECNICA_CONFORME",
      },
    });
  });
  change();
}
export async function verificarRecepcionSSOMA(form: FormData) {
  const u = await requireRole("SSOMA");
  const id = field(form, "id");
  await prisma.$transaction(async (tx) => {
    const e = await tx.custodyEvent.findUniqueOrThrow({ where: { id } });
    const last = await tx.custodyEvent.findFirst({
      where: { vehicleId: e.vehicleId },
      orderBy: { at: "desc" },
    });
    if (last?.id !== id || e.kind !== "RECEPCION")
      throw new Error("La recepción no es el evento vigente");
    if (e.safetyVerifiedAt) throw new Error("Recepción ya revisada por SSOMA");
    const unresolved = await tx.custodyInventoryLine.count({
      where: { custodyEventId: id, discrepancy: true, resolvedAt: null },
    });
    if (unresolved > 0)
      throw new Error(
        "Hay diferencias de inventario sin resolución documentada",
      );
    const critical = await tx.safetyCase.count({
      where: {
        vehicleId: e.vehicleId,
        severity: "CRITICA",
        status: { not: "CERRADO" },
      },
    });
    if (critical)
      throw new Error("Existe restricción de seguridad crítica abierta");
    await tx.custodyEvent.update({
      where: { id },
      data: { safetyVerifiedAt: new Date(), safetyVerifiedBy: u.id },
    });
    await tx.auditLog.create({
      data: {
        userId: u.id,
        entity: "CustodyEvent",
        entityId: id,
        action: "REVISION_SSOMA_CONFORME",
      },
    });
  });
  change();
}
