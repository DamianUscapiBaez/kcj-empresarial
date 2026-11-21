/** Reglas reutilizables del tareo. ROSTER es programación, no evidencia de horas reales. */
export const ORIGENES_TAREO = ["SERVICIO", "REGISTRO_INTERNO"] as const;
export type OrigenTareo = typeof ORIGENES_TAREO[number];

export function validarOrigenTareo(valor: string): OrigenTareo {
  if (valor !== "SERVICIO" && valor !== "REGISTRO_INTERNO") {
    throw new Error("Origen de tareo no permitido");
  }
  return valor;
}

export function validarVinculoServicioTareo(input: {
  workerId: string;
  servicio: {
    workerId: string | null;
    status: string;
    startsAt: Date;
    endsAt: Date;
    startedAt: Date | null;
    endedAt: Date | null;
  };
  startsAt: Date;
  endsAt: Date;
}): void {
  const {workerId, servicio, startsAt, endsAt} = input;
  if (servicio.workerId !== workerId) {
    throw new Error("El servicio no está asignado al trabajador seleccionado");
  }
  if (servicio.status !== "EN_CURSO" && servicio.status !== "FINALIZADO") {
    throw new Error("El origen debe ser un servicio iniciado o finalizado; ROSTER y servicios planificados no acreditan horas trabajadas");
  }
  const inicio = servicio.startedAt ?? servicio.startsAt;
  const fin = servicio.endedAt ?? servicio.endsAt;
  if (!(startsAt < fin && endsAt > inicio)) {
    throw new Error("Las horas reales no coinciden con el intervalo del servicio. Registre una incidencia o ajuste justificado para revisión");
  }
}

export function motivoRegistroInterno(motivo: string | null | undefined): string {
  const valor = (motivo ?? "").trim();
  if (valor.length < 12 || valor.length > 500) {
    throw new Error("Un registro interno requiere una justificación de 12 a 500 caracteres");
  }
  return valor;
}
