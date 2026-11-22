-- Fase 02.4: cambios aditivos, sin migrar ni modificar actas previas.
ALTER TABLE "EvidenceAsset" ADD COLUMN "expectedBytes" INTEGER;
-- La versión v3 fija evidencia general y entrega relacionada, manteniendo v1/v2.
ALTER TABLE "CustodyEvent" DROP CONSTRAINT IF EXISTS "CustodyEvent_contentVersion_chk";
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_contentVersion_chk" CHECK ("contentVersion" IN (1,2,3));
