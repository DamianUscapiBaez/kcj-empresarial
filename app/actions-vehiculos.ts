"use server";
import { identificacionOpcional } from "@/lib/normalizacion-datos";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import {
  catalogoInventarioMaestro,
  catalogoRutina,
  validarRutina,
  CONTEXTO_RUTINA,
  VERSION_RUTINA,
  type Ambito,
} from "@/lib/inspeccion-rutina";
import { validarNeumaticosRutina } from "@/lib/neumaticos-rutina";
import type { ResultadoItem } from "@/lib/vehiculos-integrados";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  field,
  optionalField,
  numberField,
  optionalDate,
  instant,
  flag,
} from "@/lib/form";
import { requireEvidenceOwned } from "@/lib/evidencias";
import {
  validarPaseMineroVehicular,
  requisitoMineroValido,
  validarResultadoExterno,
} from "@/lib/requisitos-mineros-kcj";
import {
  validarInventario,
  validarChecklist,
  catalogoChecklist,
  VERSION_CHECKLIST_VEHICULO,
  type RespuestaChecklist,
} from "@/lib/vehiculos-integrados";

const refresh = (id: string) => {
  revalidatePath(`/dashboard/ficha-vehicular/${id}`);
  revalidatePath("/dashboard/flota");
};

/** Datos adicionales, sin modificar la identidad, propietario ni registros de la unidad. */
export async function completarFichaVehiculo(form: FormData): Promise<void> {
  const user = await requireRole("ADMIN", "OPERACIONES", "JEFE_OPERACIONES");
  const vehicleId = field(form, "vehicleId");
  const color = identificacionOpcional(optionalField(form, "color", 50)),
    vin = optionalField(form, "vin", 50),
    engineNumber = optionalField(form, "engineNumber", 50),
    mineCode = optionalField(form, "mineCode", 50);
  await prisma.$transaction(async (tx) => {
    const before = await tx.vehicle.findUniqueOrThrow({
      where: { id: vehicleId },
      select: { color: true, vin: true, engineNumber: true, mineCode: true },
    });
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { color, vin, engineNumber, mineCode },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        entity: "Vehicle",
        entityId: vehicleId,
        action: "COMPLETAR_FICHA_VEHICULAR",
        payload: { before, after: { color, vin, engineNumber, mineCode } },
      },
    });
  });
  refresh(vehicleId);
}

/** Inventario unitario por vehículo (distinto del stock general de Almacén). */
export async function registrarEquipamientoVehiculo(
  form: FormData,
): Promise<void> {
  const user = await requireRole("ADMIN", "OPERACIONES", "JEFE_OPERACIONES");
  const vehicleId = field(form, "vehicleId"),
    code = field(form, "itemCode", 2, 80);
  const expected = numberField(form, "expectedQuantity", 0, 10000),
    actual = numberField(form, "actualQuantity", 0, 10000);
  const condition = field(form, "condition"),
    functionalStatus = field(form, "functionalStatus");
  const serial = optionalField(form, "serial", 100),
    remarks = optionalField(form, "remarks", 1000);
  const evidenceKey = optionalField(form, "evidenceKey", 400);
  validarInventario({
    expected,
    actual,
    condition,
    functionalStatus,
    remarks: remarks ?? "",
  });
  if (evidenceKey) await requireEvidenceOwned(evidenceKey, "FLOTA", user.id);
  await prisma.$transaction(
    async (tx) => {
      const vehicle = await tx.vehicle.findUniqueOrThrow({
        where: { id: vehicleId },
        select: { type: true },
      });
      const item = catalogoInventarioMaestro(vehicle.type).find(
        (x) => x.code === code,
      );
      if (!item)
        throw new Error(
          "Componente no permitido para la ficha maestra de esta unidad",
        );
      if (!item.quantity)
        throw new Error(
          "Este componente se comprueba en checklist, no lleva cantidad de inventario",
        );
      const old = await tx.vehicleEquipment.findUnique({
        where: { vehicleId_itemCode: { vehicleId, itemCode: code } },
      });
      const data = {
        category: item.category,
        label: item.label,
        expectedQuantity: expected,
        actualQuantity: actual,
        condition,
        functionalStatus,
        serial,
        evidenceKey,
        remarks,
        updatedBy: user.id,
      };
      const saved = await tx.vehicleEquipment.upsert({
        where: { vehicleId_itemCode: { vehicleId, itemCode: code } },
        create: { vehicleId, itemCode: code, ...data },
        update: data,
      });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          entity: "VehicleEquipment",
          entityId: saved.id,
          action: old ? "ACTUALIZAR_EQUIPAMIENTO" : "REGISTRAR_EQUIPAMIENTO",
          payload: {
            vehicleId,
            itemCode: code,
            before: old
              ? {
                  expected: old.expectedQuantity,
                  actual: old.actualQuantity,
                  condition: old.condition,
                  functionalStatus: old.functionalStatus,
                  serial: old.serial,
                  evidenceKey: old.evidenceKey,
                  remarks: old.remarks,
                }
              : null,
            after: {
              expected,
              actual,
              condition,
              functionalStatus,
              serial,
              evidenceKey,
              remarks,
            },
          },
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  refresh(vehicleId);
}

/** Inspección estructurada por ítem. Una inspección no sobrescribe a la anterior. */
export async function registrarChecklistVehiculo(
  form: FormData,
): Promise<void> {
  const user = await requireRole("ADMIN", "OPERACIONES", "JEFE_OPERACIONES");
  const vehicleId = field(form, "vehicleId"),
    clientEventId = field(form, "clientEventId", 10, 100);
  const context = field(form, "context");
  if (!["FICHA_INICIAL", "REVISION_PROGRAMADA"].includes(context))
    throw new Error("Tipo de revisión inválido");
  const evidenceKey = optionalField(form, "overallEvidenceKey", 400);
  if (evidenceKey) await requireEvidenceOwned(evidenceKey, "FLOTA", user.id);
  await prisma.$transaction(
    async (tx) => {
      const prior = await tx.vehicleChecklist.findUnique({
        where: { clientEventId },
      });
      if (prior) {
        if (prior.vehicleId !== vehicleId)
          throw new Error("Identificador de revisión utilizado en otra unidad");
        return;
      }
      const v = await tx.vehicle.findUniqueOrThrow({
        where: { id: vehicleId },
        select: { type: true },
      });
      const responses: RespuestaChecklist[] = catalogoChecklist(v.type).map(
        (it) => ({
          code: it.code,
          result: field(
            form,
            `resultado_${it.code}`,
          ) as RespuestaChecklist["result"],
          note: optionalField(form, `detalle_${it.code}`, 800) ?? "",
        }),
      );
      const checked = validarChecklist(v.type, responses);
      const checklist = await tx.vehicleChecklist.create({
        data: {
          vehicleId,
          clientEventId,
          context,
          templateVersion: VERSION_CHECKLIST_VEHICULO,
          vehicleType: v.type,
          status: checked.status,
          items: checked.items.map((x) => ({
            code: x.code,
            result: x.result,
            note: x.note,
          })),
          overallEvidenceKey: evidenceKey,
          performedBy: user.id,
        },
      });
      if (checked.status === "CRITICO") {
        const critical = catalogoChecklist(v.type).filter(
          (c) =>
            c.critical &&
            checked.items.some(
              (x) => x.code === c.code && x.result === "NO_CONFORME",
            ),
        );
        await tx.safetyCase.create({
          data: {
            reference: `FLOTA-${checklist.id}`,
            category: "Inspección",
            severity: "CRITICA",
            title: "Hallazgo crítico en checklist vehicular",
            details: critical
              .map((x) => x.label)
              .join("; ")
              .slice(0, 3000),
            vehicleId,
            evidenceKey,
          },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: user.id,
          entity: "VehicleChecklist",
          entityId: checklist.id,
          action: "INSPECCION_ESTRUCTURADA",
          payload: {
            vehicleId,
            context,
            status: checked.status,
            version: VERSION_CHECKLIST_VEHICULO,
            items: checked.items.length,
          },
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  refresh(vehicleId);
}

/** Tarjeta Amarilla = PASE MINERO de una unidad, nunca homologación de una persona. */
export async function registrarPaseMineroUnidad(form: FormData): Promise<void> {
  const u = await requireRole("ADMIN", "OPERACIONES", "JEFE_OPERACIONES");
  const vehicleId = field(form, "vehicleId"),
    evidenceKey = optionalField(form, "evidenceKey", 400);
  validarPaseMineroVehicular(
    "TARJETA_AMARILLA",
    vehicleId,
    optionalField(form, "workerId"),
  );
  if (
    !(await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true },
    }))
  )
    throw new Error("Unidad no registrada en Flota.");
  if (flag(form, "verified") && !evidenceKey)
    throw new Error(
      "Para registrar el pase como verificado, adjunta su evidencia.",
    );
  if (evidenceKey)
    await requireEvidenceOwned(evidenceKey, "HOMOLOGACION", u.id);
  const issuedAt = optionalDate(form, "issuedAt"),
    validUntil = instant(form, "validUntil");
  if (issuedAt && issuedAt > validUntil)
    throw new Error("Fecha de emisión posterior al vencimiento.");
  const c = await prisma.clearance.create({
    data: {
      vehicleId,
      workerId: null,
      kind: "TARJETA_AMARILLA",
      scope: field(form, "scope"),
      reference: optionalField(form, "reference", 120),
      issuedAt,
      validUntil,
      verified: flag(form, "verified"),
      evidenceKey,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: u.id,
      entity: "Clearance",
      entityId: c.id,
      action: "REGISTRAR_PASE_MINERO_VEHICULAR",
      payload: { vehicleId, scope: c.scope },
    },
  });
  refresh(vehicleId);
}

/** Registro por versión del expediente minero VEHICULAR. El estado es emitido fuera de KCJ. */
export async function registrarRequisitoMineroUnidad(
  form: FormData,
): Promise<void> {
  const u = await requireRole("ADMIN", "OPERACIONES", "JEFE_OPERACIONES");
  const vehicleId = field(form, "vehicleId"),
    kind = field(form, "kind"),
    mineScope = field(form, "mineScope", 2, 100);
  if (!requisitoMineroValido(kind))
    throw new Error("Seleccione un requisito del catálogo minero vehicular.");
  if (
    !(await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true },
    }))
  )
    throw new Error("La unidad no está registrada en Flota.");
  const externalStatus = field(form, "externalStatus"),
    reference = optionalField(form, "reference", 120);
  const evidenceKey = optionalField(form, "evidenceKey", 400),
    remarks = optionalField(form, "remarks", 1000);
  validarResultadoExterno(externalStatus, reference, evidenceKey, remarks);
  if (evidenceKey)
    await requireEvidenceOwned(evidenceKey, "HOMOLOGACION", u.id);
  const issuedAt = optionalDate(form, "issuedAt"),
    validUntil = optionalDate(form, "validUntil");
  if (issuedAt && validUntil && issuedAt > validUntil)
    throw new Error("Vencimiento anterior a la fecha de emisión.");
  const v = await prisma.vehicleMiningDocument.create({
    data: {
      vehicleId,
      kind,
      mineScope,
      externalStatus,
      reference,
      issuedAt,
      validUntil,
      evidenceKey,
      remarks,
      recordedBy: u.id,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: u.id,
      entity: "VehicleMiningDocument",
      entityId: v.id,
      action: "REGISTRAR_VERSION_RESULTADO_EXTERNO",
      payload: { vehicleId, kind, mineScope, externalStatus },
    },
  });
  refresh(vehicleId);
}

/** Rutina: instantánea separada de custodia y del preoperacional. No altera el inventario vivo. */
export async function registrarInspeccionRutina(form: FormData): Promise<void> {
  const user = await requireRole("ADMIN", "OPERACIONES", "JEFE_OPERACIONES");
  const vehicleId = field(form, "vehicleId"),
    clientEventId = field(form, "clientEventId", 10, 100);
  const ambito = field(form, "ambito") as Ambito,
    escolta = flag(form, "escolta"),
    patrulla = flag(form, "patrulla"),
    accesoMina = flag(form, "accesoMina");
  const location = field(form, "location", 2, 160),
    kilometers = numberField(form, "kilometers", 0, 10000000),
    fuel = field(form, "fuel"),
    actions = optionalField(form, "actions", 2000) ?? "";
  if (
    !Number.isSafeInteger(kilometers) ||
    !["E", "1/4", "1/2", "3/4", "F"].includes(fuel) ||
    !flag(form, "confirm")
  )
    throw new Error(
      "Confirme la inspección y compruebe kilometraje y combustible",
    );
  const evidenceKey = optionalField(form, "overallEvidenceKey", 400);
  if (evidenceKey) await requireEvidenceOwned(evidenceKey, "FLOTA", user.id);
  const id = await prisma.$transaction(
    async (tx) => {
      const prior = await tx.vehicleChecklist.findUnique({
        where: { clientEventId },
      });
      if (prior) {
        if (
          prior.vehicleId !== vehicleId ||
          prior.performedBy !== user.id ||
          prior.context !== CONTEXTO_RUTINA
        )
          throw new Error("Identificador de inspección en conflicto");
        return prior.id;
      }
      const v = await tx.vehicle.findUniqueOrThrow({
        where: { id: vehicleId },
        include: { equipment: true },
      });
      if (!v.active) throw new Error("Unidad inactiva");
      const items = catalogoRutina(
        v.type,
        v.equipment,
        ambito,
        escolta,
        patrulla,
        accesoMina,
      );
      const answers = items.map((x) => {
        const result = field(form, `resultado_${x.code}`) as ResultadoItem;
        return {
          code: x.code,
          result,
          note: optionalField(form, `nota_${x.code}`, 800) ?? "",
          found:
            x.quantity && result !== "NO_APLICA"
              ? numberField(form, `cantidad_${x.code}`, 0, 10000)
              : null,
          detail: optionalField(form, `detalle_${x.code}`, 6000) ?? "",
        };
      });
      const checked = validarRutina(items, answers);
      const tires = validarNeumaticosRutina(
        JSON.parse(field(form, "tires", 2, 30000)),
      );
      if (
        tires.some((t) => t.condition !== "CONFORME") &&
        answers.find((a) => a.code === "NEUM_CONFIG")?.result === "CONFORME"
      )
        throw new Error(
          "La evaluación de neumáticos debe reflejar los hallazgos individuales.",
        );
      const hallazgosCriticos = items.filter(
        (x) =>
          x.critical &&
          checked.rows.some(
            (r) => r.code === x.code && r.result === "NO_CONFORME",
          ),
      );
      const estadoRutina =
        hallazgosCriticos.length > 0 ? "CRITICO" : checked.status;
      if (
        (estadoRutina !== "CONFORME" ||
          checked.rows.some((r) => r.result === "NO_CONFORME")) &&
        actions.trim().length < 5
      )
        throw new Error(
          "Registre acciones correctivas propuestas para los hallazgos",
        );
      const checklist = await tx.vehicleChecklist.create({
        data: {
          vehicleId,
          clientEventId,
          context: CONTEXTO_RUTINA,
          templateVersion: VERSION_RUTINA,
          vehicleType: v.type,
          status: estadoRutina,
          items: {
            identity: {
              plate: v.plate,
              code: v.code,
              mineCode: v.mineCode,
              make: v.make,
              model: v.model,
              inspector: user.displayName,
            },
            ambito,
            escolta,
            patrulla,
            accesoMina,
            location,
            kilometers,
            fuel,
            actions,
            tires,
            rows: checked.rows,
          },
          overallEvidenceKey: evidenceKey,
          performedBy: user.id,
        },
      });
      if (hallazgosCriticos.length > 0)
        await tx.safetyCase.create({
          data: {
            reference: `FLOTA-${checklist.id}`,
            category: "Inspección",
            severity: "CRITICA",
            title: "Hallazgo crítico en inspección integral de rutina",
            details: hallazgosCriticos
              .map((x) => x.label)
              .join("; ")
              .slice(0, 3000),
            vehicleId,
            evidenceKey,
          },
        });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          entity: "VehicleChecklist",
          entityId: checklist.id,
          action: "INSPECCION_RUTINA",
          payload: {
            vehicleId,
            ambito,
            status: estadoRutina,
            version: VERSION_RUTINA,
            items: checked.rows.length,
            kilometers,
          },
        },
      });
      return checklist.id;
    },
    { isolationLevel: "Serializable" },
  );
  refresh(vehicleId);
  redirect(`/dashboard/ficha-vehicular/${vehicleId}/rutina/${id}`);
}
