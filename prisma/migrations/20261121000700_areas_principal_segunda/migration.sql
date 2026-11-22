-- Migración aditiva: no altera ni elimina las áreas existentes de los colaboradores.
ALTER TABLE "Worker" ADD COLUMN "secondaryArea" TEXT;
CREATE INDEX "Worker_secondaryArea_idx" ON "Worker"("secondaryArea");
CREATE TABLE "WorkArea" (
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkArea_pkey" PRIMARY KEY ("name")
);
-- Áreas de referencia de KCJ: las funciones Flota/ROSTER/Tareo/Homologación no son departamentos.
INSERT INTO "WorkArea"("name") VALUES
 ('Operaciones'),('SSOMA'),('Salud Ocupacional'),('Recursos Humanos'),
 ('Mantenimiento'),('Gerencia'),('Tecnología de la Información')
ON CONFLICT DO NOTHING;
-- Conservar nombres previos de producción (aunque sean distintos) como opciones editables.
INSERT INTO "WorkArea"("name")
 SELECT DISTINCT BTRIM("area") FROM "Worker" WHERE "area" IS NOT NULL AND BTRIM("area") <> ''
ON CONFLICT DO NOTHING;
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_areas_distintas_chk"
 CHECK ("secondaryArea" IS NULL OR LOWER(BTRIM("secondaryArea")) <> LOWER(BTRIM("area")));
