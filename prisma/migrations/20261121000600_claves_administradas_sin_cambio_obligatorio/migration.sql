-- Mantiene cuentas y contraseñas existentes; solo cambia el valor por defecto para las nuevas filas.
ALTER TABLE "User" ALTER COLUMN "mustChangePassword" SET DEFAULT false;
