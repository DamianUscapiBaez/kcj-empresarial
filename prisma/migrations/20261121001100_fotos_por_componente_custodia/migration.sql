-- Fase 02.3: migración ADITIVA. Las actas/firma v1 se conservan sin recalcular.
ALTER TABLE "CustodyEvent" ADD COLUMN "contentVersion" INTEGER NOT NULL DEFAULT 1;
CREATE TABLE "CustodyItemPhoto" (
  "id" TEXT NOT NULL,
  "custodyLineId" TEXT NOT NULL,
  "evidenceKey" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustodyItemPhoto_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "CustodyItemPhoto" ADD CONSTRAINT "CustodyItemPhoto_custodyLineId_fkey"
  FOREIGN KEY ("custodyLineId") REFERENCES "CustodyInventoryLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "CustodyItemPhoto_evidenceKey_key" ON "CustodyItemPhoto"("evidenceKey");
CREATE INDEX "CustodyItemPhoto_custodyLineId_createdAt_idx" ON "CustodyItemPhoto"("custodyLineId","createdAt");
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_contentVersion_chk" CHECK ("contentVersion" IN (1,2));
