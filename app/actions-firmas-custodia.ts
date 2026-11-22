
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

// Tipo exacto que requiere nombreFirmante.
type LadoFirmaCustodia = Parameters<typeof nombreFirmante>[1];

/**
 * Registra una firma manuscrita de custodia.
 *
 * La firma debe ser capturada por un operador
 * autorizado en presencia del firmante.
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

  // Verificar permisos del operador.
  const actor = await requireRole(
    "ADMIN",
    "OPERACIONES",
    "JEFE_OPERACIONES"
  );

  // Validar identificador del acta.
  if (
    typeof data.eventId !== "string" ||
    !data.eventId.trim() ||
    data.eventId.length > 120
  ) {
    throw new Error("Acta inválida");
  }

  // Validar lado de firma.
  validarLadoFirma(data.side);

  // Corregir incompatibilidad de tipos.
  const side = data.side as LadoFirmaCustodia;

  // Confirmar presencia física del firmante.
  if (data.witnessedInPerson !== true) {
    throw new Error(
      "Debe confirmar que la persona firmó en presencia del operador"
    );
  }

  // Validar referencia de evidencia.
  if (
    typeof data.evidenceKey !== "string" ||
    data.evidenceKey.length > 400
  ) {
    throw new Error("Evidencia de firma inválida");
  }

  // Verificar propiedad y propósito de la evidencia.
  await requireEvidenceOwned(
    data.evidenceKey,
    "CUSTODIA",
    actor.id
  );

  // Consultar metadatos de la evidencia.
  const evidence =
    await prisma.evidenceAsset.findUniqueOrThrow({
      where: {
        key: data.evidenceKey
      },
      select: {
        contentType: true,
        filename: true
      }
    });

  // La evidencia debe ser un PNG generado
  // desde el formulario de firmas.
  if (
    evidence.contentType !== "image/png" ||
    !evidence.filename.startsWith("firma-custodia-")
  ) {
    throw new Error(
      "La firma debe ser una imagen PNG capturada en el formulario"
    );
  }

  let vehicleId = "";

  // Registrar firma y auditoría en una transacción.
  await prisma.$transaction(
    async (tx) => {

      // Obtener acta, inventario y firmas existentes.
      const event =
        await tx.custodyEvent.findUniqueOrThrow({
          where: {
            id: data.eventId
          },
          include: {
            items: {
              include: {
                photos: true
              }
            },
            signatures: true
          }
        });

      vehicleId = event.vehicleId;

      // Verificar movimiento admitido.
      if (
        event.kind !== "ENTREGA" &&
        event.kind !== "RECEPCION"
      ) {
        throw new Error(
          "El movimiento no admite firmas de custodia"
        );
      }

      // Impedir duplicación de firmas.
      if (
        event.signatures.some(
          (signature) => signature.side === side
        )
      ) {
        throw new Error(
          "Esta persona ya tiene una firma registrada en el acta. No se permiten reemplazos"
        );
      }

      // Exigir inventario histórico.
      if (!event.items.length) {
        throw new Error(
          "El acta no tiene inventario histórico. Requiere regularización supervisada"
        );
      }

      // Obtener acta vigente de la unidad.
      const latest =
        await tx.custodyEvent.findFirst({
          where: {
            vehicleId: event.vehicleId
          },
          orderBy: [
            { at: "desc" },
            { id: "desc" }
          ],
          select: {
            id: true
          }
        });

      // Impedir firmas retroactivas.
      if (latest?.id !== event.id) {
        throw new Error(
          "Solo puede firmarse el acta vigente de la unidad; no se insertan firmas retroactivas en actas antiguas"
        );
      }

      // Obtener identidad del firmante.
      const signerName = nombreFirmante(
        event,
        side
      );

      // Generar huella del acta.
      const documentHash =
        huellaActaCustodia(event);

      // Registrar firma.
      const signature =
        await tx.custodySignature.create({
          data: {
            custodyEventId: event.id,
            side,
            signerName,
            evidenceKey: data.evidenceKey,
            documentHash,
            capturedById: actor.id,
            witnessedInPerson: true
          }
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
            presencial: true
          }
        }
      });

    },
    {
      isolationLevel: "Serializable"
    }
  );

  // Actualizar páginas afectadas.
  revalidatePath(
    `/actas/custodia/${data.eventId}`
  );

  revalidatePath(
    `/dashboard/custodia/${vehicleId}`
  );
}
