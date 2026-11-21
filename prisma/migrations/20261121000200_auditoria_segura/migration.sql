-- Migración ADITIVA: conserva registros, cuentas, intentos y auditorías existentes.
CREATE TABLE "UserRoleGrant" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "grantedBy" TEXT NOT NULL,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "UserRoleGrant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserRoleGrant_userId_role_key" ON "UserRoleGrant"("userId","role");
CREATE INDEX "UserRoleGrant_userId_revokedAt_idx" ON "UserRoleGrant"("userId","revokedAt");
ALTER TABLE "UserRoleGrant" ADD CONSTRAINT "UserRoleGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Service" ADD COLUMN "mineScope" TEXT;
ALTER TABLE "Course" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Course" ADD COLUMN "seriesKey" TEXT;
ALTER TABLE "Course" ADD COLUMN "requireMaterial" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "CourseMaterial" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CourseMaterial_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "CourseMaterial" ADD CONSTRAINT "CourseMaterial_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD COLUMN "materialValidatedAt" TIMESTAMP(3);
ALTER TABLE "Enrollment" ADD COLUMN "cycle" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "QuizAttempt" ADD COLUMN "cycle" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "CustodyEvent" ADD COLUMN "technicalVerifiedAt" TIMESTAMP(3);
ALTER TABLE "CustodyEvent" ADD COLUMN "technicalVerifiedBy" TEXT;
ALTER TABLE "CustodyEvent" ADD COLUMN "safetyVerifiedAt" TIMESTAMP(3);
ALTER TABLE "CustodyEvent" ADD COLUMN "safetyVerifiedBy" TEXT;
ALTER TABLE "SafetyCase" ADD COLUMN "evidenceKey" TEXT;
ALTER TABLE "Course" ADD COLUMN "requiresExam" BOOLEAN NOT NULL DEFAULT true;
