-- Registro único de la cuenta Administradora Principal, sin alterar usuarios existentes.
CREATE TABLE "PrimaryAdminProtection" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "protectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrimaryAdminProtection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PrimaryAdminProtection_singleton_check" CHECK ("id" = 'PRIMARY')
);
CREATE UNIQUE INDEX "PrimaryAdminProtection_userId_key" ON "PrimaryAdminProtection"("userId");
ALTER TABLE "PrimaryAdminProtection" ADD CONSTRAINT "PrimaryAdminProtection_userId_fkey"
 FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
