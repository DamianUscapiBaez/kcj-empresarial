-- Migración aditiva de asistencia presencial y participación virtual.
-- Conserva las convocatorias, notas y constancias existentes.
CREATE TYPE "TrainingModality" AS ENUM ('PRESENCIAL', 'VIRTUAL');
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDIENTE', 'ASISTIO', 'NO_ASISTIO', 'JUSTIFICADO');
ALTER TYPE "EvidencePurpose" ADD VALUE IF NOT EXISTS 'AULA';
ALTER TABLE "Course"
  ADD COLUMN "modality" "TrainingModality" NOT NULL DEFAULT 'PRESENCIAL',
  ADD COLUMN "minVirtualMinutes" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Enrollment"
  ADD COLUMN "attendanceStatus" "AttendanceStatus" NOT NULL DEFAULT 'PENDIENTE',
  ADD COLUMN "attendanceRecordedAt" TIMESTAMP(3),
  ADD COLUMN "attendanceRecordedBy" TEXT,
  ADD COLUMN "attendanceEvidenceKey" TEXT,
  ADD COLUMN "absenceReason" TEXT,
  ADD COLUMN "virtualStartedAt" TIMESTAMP(3),
  ADD COLUMN "virtualCompletedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Enrollment_attendanceEvidenceKey_key" ON "Enrollment"("attendanceEvidenceKey");
-- Migración del dato preexistente: no se atribuye sin evidencia a un nuevo responsable.
UPDATE "Enrollment" SET "attendanceStatus" = 'ASISTIO', "attendanceRecordedAt" = "attendedAt"
WHERE "attendedAt" IS NOT NULL;
