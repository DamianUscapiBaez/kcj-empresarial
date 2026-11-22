-- Fase 02 aditiva: preserva actas, inventarios de Flota y documentos anteriores.
ALTER TABLE "CustodyEvent"
 ADD COLUMN "clientEventId" TEXT,
 ADD COLUMN "location" TEXT,
 ADD COLUMN "senderName" TEXT,
 ADD COLUMN "receiverName" TEXT,
 ADD COLUMN "odometerKm" INTEGER,
 ADD COLUMN "fuelPercent" INTEGER,
 ADD COLUMN "relatedDeliveryId" TEXT;
CREATE UNIQUE INDEX "CustodyEvent_clientEventId_key" ON "CustodyEvent"("clientEventId");
CREATE INDEX "CustodyEvent_vehicleId_at_idx" ON "CustodyEvent"("vehicleId","at");
CREATE INDEX "CustodyEvent_relatedDeliveryId_idx" ON "CustodyEvent"("relatedDeliveryId");
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_fuelPercent_chk"
 CHECK ("fuelPercent" IS NULL OR ("fuelPercent" BETWEEN 0 AND 100));
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_odometerKm_chk"
 CHECK ("odometerKm" IS NULL OR "odometerKm" >= 0);
CREATE TABLE "CustodyInventoryLine" (
 "id" TEXT NOT NULL,
 "custodyEventId" TEXT NOT NULL,
 "itemCode" TEXT NOT NULL,
 "label" TEXT NOT NULL,
 "serial" TEXT,
 "expectedQuantity" INTEGER NOT NULL,
 "actualQuantity" INTEGER NOT NULL,
 "damagedQuantity" INTEGER NOT NULL DEFAULT 0,
 "condition" TEXT NOT NULL,
 "notes" TEXT,
 "discrepancy" BOOLEAN NOT NULL DEFAULT false,
 "resolvedAt" TIMESTAMP(3),
 "resolvedBy" TEXT,
 "resolutionReason" TEXT,
 "resolutionEvidenceKey" TEXT,
 CONSTRAINT "CustodyInventoryLine_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "CustodyInventoryLine_cantidades_chk" CHECK (
    "expectedQuantity" >= 0 AND "actualQuantity" >= 0
    AND "damagedQuantity" >= 0 AND "damagedQuantity" <= "actualQuantity")
);
CREATE UNIQUE INDEX "CustodyInventoryLine_custodyEventId_itemCode_key" ON "CustodyInventoryLine"("custodyEventId","itemCode");
CREATE INDEX "CustodyInventoryLine_custodyEventId_discrepancy_resolvedAt_idx" ON "CustodyInventoryLine"("custodyEventId","discrepancy","resolvedAt");
ALTER TABLE "CustodyInventoryLine" ADD CONSTRAINT "CustodyInventoryLine_custodyEventId_fkey"
 FOREIGN KEY ("custodyEventId") REFERENCES "CustodyEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
