-- Fase 02.2: cambios aditivos. No altera actas, inventarios ni firmas legadas.
CREATE TABLE "CustodySignature" (
    "id" TEXT NOT NULL,
    "custodyEventId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "evidenceKey" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "capturedById" TEXT NOT NULL,
    "witnessedInPerson" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustodySignature_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "CustodySignature" ADD CONSTRAINT "CustodySignature_custodyEventId_fkey"
  FOREIGN KEY ("custodyEventId") REFERENCES "CustodyEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "CustodySignature_custodyEventId_side_key" ON "CustodySignature"("custodyEventId","side");
CREATE UNIQUE INDEX "CustodySignature_evidenceKey_key" ON "CustodySignature"("evidenceKey");
CREATE INDEX "CustodySignature_custodyEventId_signedAt_idx" ON "CustodySignature"("custodyEventId","signedAt");
ALTER TABLE "CustodySignature" ADD CONSTRAINT "CustodySignature_side_chk" CHECK ("side" IN ('ENTREGA','RECIBE'));
