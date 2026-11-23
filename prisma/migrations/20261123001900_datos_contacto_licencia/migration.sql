-- Campos opcionales en la ficha única, sin modificar datos existentes.
ALTER TABLE "Worker" ADD COLUMN "phone" TEXT;
ALTER TABLE "Worker" ADD COLUMN "licenseCategory" TEXT;
ALTER TABLE "Worker" ADD COLUMN "licenseIssuedAt" TIMESTAMP(3);
