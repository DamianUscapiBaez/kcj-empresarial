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

// Obtenemos el tipo exacto esperado por nombreFirmante.
type LadoFirmaCustodia = Parameters<typeof nombreFirmante>[1];

/**
 * Registra una firma manuscrita de custodia.
 *
 * La firma debe capturarse en presencia de un
 * operador autorizado.
 *
 * El trazo no acredita por sí solo identidad
 * ni constituye una firma digital certificada.
 */
export async function registrarFirmaCustodia(data: {
  eventId: string;
  side: string;
  evidenceKey: string;
  witnessedInPerson: boolean;
}): Promise<void> {
  const actor = await requireRole("ADMIN", "OPERACIONES", "JEFE_OPERACIONES");

  // Validar identificador del acta.
  if (
    typeof data.eventId !== "string" ||
    !data.eventId.trim() ||
    data.eventId.length > 120
  ) {
    throw new Error("Acta inválida");
  }

  // Validar el lado de la firma.
  validarLadoFirma(data.side);

  // Conservar el tipo requerido por nombreFirmante.
  // La conversión depende de la validación anterior.
  const side = data.side as LadoFirmaCustodia;

  // La persona debe firmar presencialmente.
  if (data.witnessedInPerson !== true) {
    throw new Error(
      "Debe confirmar que la persona firmó en presencia del operador",
    );
  }

  // Validar evidencia.
  if (typeof data.evidenceKey !== "string" || data.evidenceKey.length > 400) {
    throw new Error("Evidencia de firma inválida");
  }

  await requireEvidenceOwned(data.evidenceKey, "CUSTODIA", actor.id);

  const evidence = await prisma.evidenceAsset.findUniqueOrThrow({
    where: {
      key: data.evidenceKey,
    },
    select: {
      contentType: true,
      filename: true,
    },
  });

  // Solo se permite una imagen PNG capturada
  // en el formulario correspondiente.
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
      // Recuperar acta, inventario y firmas.
      const event = await tx.custodyEvent.findUniqueOrThrow({
        where: {
          id: data.eventId,
        },
        include: {
          items: {
            include: {
              photos: true,
            },
          },
          signatures: true,
        },
      });

      vehicleId = event.vehicleId;

      // Solo se admiten movimientos de
      // entrega y recepción.
      if (event.kind !== "ENTREGA" && event.kind !== "RECEPCION") {
        throw new Error("El movimiento no admite firmas de custodia");
      }

      // Impedir firmas duplicadas.
      if (event.signatures.some((signature) => signature.side === side)) {
        throw new Error(
          "Esta persona ya tiene una firma registrada en el acta. No se permiten reemplazos",
        );
      }

      // Verificar inventario histórico.
      if (!event.items.length) {
        throw new Error(
          "El acta no tiene inventario histórico. Requiere regularización supervisada",
        );
      }

      // Verificar que el acta sea la vigente.
      const latest = await tx.custodyEvent.findFirst({
        where: {
          vehicleId: event.vehicleId,
        },
        orderBy: [{ at: "desc" }, { id: "desc" }],
        select: {
          id: true,
        },
      });

      if (latest?.id !== event.id) {
        throw new Error(
          "Solo puede firmarse el acta vigente de la unidad; no se insertan firmas retroactivas en actas antiguas",
        );
      }

      // Identificar al firmante.
      const signerName = nombreFirmante(event, side);

      // Calcular huella del documento.
      const documentHash = huellaActaCustodia(event);

      // Registrar la firma.
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

      // Registrar auditoría.
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
    {
      isolationLevel: "Serializable",
    },
  );

  // Actualizar las páginas afectadas.
  revalidatePath(`/actas/custodia/${data.eventId}`);

  revalidatePath(`/dashboard/custodia/${vehicleId}`);
}
