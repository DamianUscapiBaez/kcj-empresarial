-- Migración aditiva: conserva todos los tareos existentes sin recalcular su área histórica.
ALTER TABLE "Timesheet" ADD COLUMN "areaAtEntry" TEXT;
