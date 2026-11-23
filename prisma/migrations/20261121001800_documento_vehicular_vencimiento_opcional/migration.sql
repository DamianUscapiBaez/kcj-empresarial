-- Documentos permanentes, por ejemplo tarjeta de propiedad, pueden no vencer.
-- Requisitos con vencimiento obligatorio (SOAT y revisión técnica) se controlan en servidor.
ALTER TABLE "VehicleDocument" ALTER COLUMN "expiresAt" DROP NOT NULL;
