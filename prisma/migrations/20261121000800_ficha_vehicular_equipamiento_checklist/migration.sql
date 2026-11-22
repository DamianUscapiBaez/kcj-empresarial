-- KCJ CONTROL fase 1: ficha maestra, inventario por unidad e inspección por ítem.
-- Aditiva: conserva Vehicle, Clearance, custodias y documentos existentes.
ALTER TABLE "Vehicle" ADD COLUMN "color" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "vin" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "engineNumber" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "mineCode" TEXT;
ALTER TABLE "Clearance" ADD COLUMN "reference" TEXT;
ALTER TABLE "Clearance" ADD COLUMN "issuedAt" TIMESTAMP(3);
CREATE TABLE "VehicleEquipment" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "itemCode" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "expectedQuantity" INTEGER NOT NULL,
  "actualQuantity" INTEGER NOT NULL,
  "condition" TEXT NOT NULL,
  "functionalStatus" TEXT NOT NULL,
  "serial" TEXT,
  "evidenceKey" TEXT,
  "remarks" TEXT,
  "updatedBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VehicleEquipment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VehicleEquipment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VehicleEquipment_cantidades_chk" CHECK ("expectedQuantity" >= 0 AND "actualQuantity" >= 0),
  CONSTRAINT "VehicleEquipment_vehicleId_itemCode_key" UNIQUE ("vehicleId","itemCode")
);
CREATE INDEX "VehicleEquipment_vehicleId_category_idx" ON "VehicleEquipment"("vehicleId","category");
CREATE TABLE "VehicleChecklist" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "clientEventId" TEXT NOT NULL,
  "context" TEXT NOT NULL,
  "templateVersion" INTEGER NOT NULL,
  "vehicleType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "items" JSONB NOT NULL,
  "overallEvidenceKey" TEXT,
  "performedBy" TEXT NOT NULL,
  "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VehicleChecklist_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VehicleChecklist_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VehicleChecklist_clientEventId_key" UNIQUE ("clientEventId")
);
CREATE INDEX "VehicleChecklist_vehicleId_performedAt_idx" ON "VehicleChecklist"("vehicleId","performedAt");

-- Inspección diaria del conductor vinculada a un servicio real.
ALTER TABLE "Inspection" ADD COLUMN "serviceId" TEXT;
ALTER TABLE "Inspection" ADD COLUMN "templateVersion" INTEGER;
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Inspection_serviceId_idx" ON "Inspection"("serviceId");
