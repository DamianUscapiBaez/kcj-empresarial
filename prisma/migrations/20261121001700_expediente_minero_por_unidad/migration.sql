-- Aditiva: NO altera trabajadores, permisos, Clearance ni documentos anteriores.
CREATE TABLE "VehicleMiningDocument" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mineScope" TEXT NOT NULL DEFAULT 'LAS_BAMBAS',
    "externalStatus" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "reference" TEXT,
    "issuedAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "evidenceKey" TEXT,
    "remarks" TEXT,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VehicleMiningDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VehicleMiningDocument_vehicleId_mineScope_kind_createdAt_idx" ON "VehicleMiningDocument"("vehicleId", "mineScope", "kind", "createdAt");
ALTER TABLE "VehicleMiningDocument" ADD CONSTRAINT "VehicleMiningDocument_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
