"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { requireEvidenceOwned } from "@/lib/evidencias";
import {
  huellaActaCustodia,
  nombreFirmante,
  validarLadoFirma,
} from "@/lib/custodia-firmas";
import { revalidatePath } from "next/cache";

type LadoFirmaCustodia = Parameters<typeof nombreFirmante>[1];

/** Registrado por operador autorizado que presencia a la persona que firma.
 * El trazo no acredita por sí solo identidad ni es firma digital certificada. */
export async function registrarFirmaCustodia(data: {
  eventId: string;
  side: string;
  evidenceKey: string;
  witnessedInPerson: boolean;
}): Promise<void> {
  const actor = await requireRole("ADMIN", "OPERACIONES", "JEFE_OPERACIONES");

  if (
    typeof data.eventId !== "string" ||
    !data.eventId.trim() ||
    data.eventId.length > 120
  ) {
    throw new Error("Acta inválida");
  }

  validarLadoFirma(data.side);
  // Esta conversión es segura si validarLadoFirma rechaza cualquier valor inválido.
  const side = data.side as LadoFirmaCustodia;

  if (data.witnessedInPerson !== true) {
    throw new Error(
      "Debe confirmar que la persona firmó en presencia del operador",
    );
  }

  if (
    typeof data.evidenceKey !== "string" ||
    !data.evidenceKey.trim() ||
    data.evidenceKey.length > 400
  ) {
    throw new Error("Evidencia de firma inválida");
  }

  await requireEvidenceOwned(data.evidenceKey, "CUSTODIA", actor.id);

  const evidence = await prisma.evidenceAsset.findUniqueOrThrow({
    where: { key: data.evidenceKey },
    select: { contentType: true, filename: true },
  });

  if (
    evidence.contentType !== "image/png" ||
    !evidence.filename.startsWith("firma-custodia-")
  ) {
    throw new Error(
      "La firma debe ser una imagen PNG capturada en el formulario",
    );
  }

  let vehicleId = "";

  await prisma.$transaction(
    async (tx) => {
      const event = await tx.custodyEvent.findUniqueOrThrow({
        where: { id: data.eventId },
        include: { items: { include: { photos: true } }, signatures: true },
      });

      vehicleId = event.vehicleId;

      if (event.kind !== "ENTREGA" && event.kind !== "RECEPCION") {
        throw new Error("El movimiento no admite firmas de custodia");
      }

      if (event.signatures.some((s) => s.side === side)) {
        throw new Error(
          "Esta persona ya tiene una firma registrada en el acta. No se permiten reemplazos",
        );
      }

      if (!event.items.length) {
        throw new Error(
          "El acta no tiene inventario histórico. Requiere regularización supervisada",
        );
      }

      const latest = await tx.custodyEvent.findFirst({
        where: { vehicleId: event.vehicleId },
        orderBy: [{ at: "desc" }, { id: "desc" }],
        select: { id: true },
      });

      if (latest?.id !== event.id) {
        throw new Error(
          "Solo puede firmarse el acta vigente de la unidad; no se insertan firmas retroactivas en actas antiguas",
        );
      }

      const signerName = nombreFirmante(event, side);
      const documentHash = huellaActaCustodia(event);

      const signature = await tx.custodySignature.create({
        data: {
          custodyEventId: event.id,
          side,
          signerName,
          evidenceKey: data.evidenceKey,
          documentHash,
          capturedById: actor.id,
          witnessedInPerson: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actor.id,
          entity: "CustodySignature",
          entityId: signature.id,
          action: "CAPTURA_FIRMA_MANUSCRITA",
          payload: {
            acta: event.id,
            side,
            signerName,
            documentHash,
            evidenceKey: data.evidenceKey,
            presencial: true,
          },
        },
      });
    },
    { isolationLevel: "Serializable" },
  );

  revalidatePath(`/actas/custodia/${data.eventId}`);
  revalidatePath(`/dashboard/custodia/${vehicleId}`);
}
