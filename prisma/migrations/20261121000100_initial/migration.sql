-- Base inicial KCJ Control · PostgreSQL · creación no destructiva

CREATE TYPE "Role" AS ENUM ('ADMIN', 'GERENCIA', 'OPERACIONES', 'JEFE_OPERACIONES', 'SSOMA', 'MANTENIMIENTO', 'RRHH', 'SALUD', 'HOMOLOGACION', 'INSTRUCTOR', 'ALMACEN', 'CONDUCTOR', 'PROPIETARIO');

CREATE TYPE "CaseStatus" AS ENUM ('ABIERTO', 'EN_ACCION', 'VERIFICADO', 'CERRADO');

CREATE TYPE "ActionStatus" AS ENUM ('PENDIENTE', 'EJECUTADA', 'VERIFICADA');

CREATE TYPE "WorkStatus" AS ENUM ('ABIERTA', 'EN_PROCESO', 'LIBERADA');

CREATE TYPE "RosterStatus" AS ENUM ('BORRADOR', 'PUBLICADO');

CREATE TYPE "RosterKind" AS ENUM ('GUARDIA', 'DESCANSO');

CREATE TYPE "ServiceStatus" AS ENUM ('PLANIFICADO', 'ASIGNADO', 'EN_CURSO', 'FINALIZADO', 'CANCELADO');

CREATE TYPE "FitnessStatus" AS ENUM ('APTO', 'RESTRINGIDO', 'NO_APTO', 'PENDIENTE');

CREATE TYPE "ApprovalStatus" AS ENUM ('PENDIENTE', 'VALIDADO', 'OBSERVADO');

CREATE TYPE "EvidencePurpose" AS ENUM ('FLOTA', 'MANTENIMIENTO', 'SSOMA', 'HOMOLOGACION', 'RRHH', 'CUSTODIA', 'CONNECT');

CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id"),
    "document" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "license" TEXT,
    "licenseExpires" TIMESTAMP(3),
    "entryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
    "workerId" TEXT,
    "ownerId" TEXT,
    "login" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
    "userId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id"),
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "contact" TEXT
);

CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id"),
    "code" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "ownerId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "VehicleDocument" (
    "id" TEXT NOT NULL,
    CONSTRAINT "VehicleDocument_pkey" PRIMARY KEY ("id"),
    "vehicleId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "reference" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "evidenceKey" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "OdometerReading" (
    "id" TEXT NOT NULL,
    CONSTRAINT "OdometerReading_pkey" PRIMARY KEY ("id"),
    "vehicleId" TEXT NOT NULL,
    "kilometers" INTEGER NOT NULL,
    "evidenceKey" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id"),
    "vehicleId" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "status" "WorkStatus" NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "releasedBy" TEXT,
    "evidenceKey" TEXT
);

CREATE TABLE "Clearance" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Clearance_pkey" PRIMARY KEY ("id"),
    "workerId" TEXT,
    "vehicleId" TEXT,
    "kind" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "evidenceKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "MedicalFitness" (
    "id" TEXT NOT NULL,
    CONSTRAINT "MedicalFitness_pkey" PRIMARY KEY ("id"),
    "workerId" TEXT NOT NULL,
    "status" "FitnessStatus" NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "reviewedBy" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Roster" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Roster_pkey" PRIMARY KEY ("id"),
    "workerId" TEXT NOT NULL,
    "kind" "RosterKind" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "RosterStatus" NOT NULL,
    "createdBy" TEXT NOT NULL,
    "publishedBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Service_pkey" PRIMARY KEY ("id"),
    "code" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "mineRequired" BOOLEAN NOT NULL DEFAULT false,
    "workerId" TEXT,
    "vehicleId" TEXT,
    "status" "ServiceStatus" NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ServiceEvent" (
    "id" TEXT NOT NULL,
    CONSTRAINT "ServiceEvent_pkey" PRIMARY KEY ("id"),
    "serviceId" TEXT NOT NULL,
    "clientEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id"),
    "clientEventId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "checklist" JSONB NOT NULL,
    "kilometers" INTEGER,
    "evidenceKey" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Timesheet" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id"),
    "workerId" TEXT NOT NULL,
    "serviceId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "status" "ApprovalStatus" NOT NULL,
    "source" TEXT NOT NULL,
    "reason" TEXT,
    "reviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "SafetyCase" (
    "id" TEXT NOT NULL,
    CONSTRAINT "SafetyCase_pkey" PRIMARY KEY ("id"),
    "reference" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL,
    "workerId" TEXT,
    "vehicleId" TEXT,
    "closureReason" TEXT,
    "closedBy" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "SafetyAction" (
    "id" TEXT NOT NULL,
    CONSTRAINT "SafetyAction_pkey" PRIMARY KEY ("id"),
    "caseId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "ActionStatus" NOT NULL,
    "evidenceKey" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3)
);

CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id"),
    "workerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "evidenceKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id"),
    "title" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "hours" DOUBLE PRECISION NOT NULL,
    "passingScore" INTEGER NOT NULL DEFAULT 80,
    "maxAttempts" INTEGER NOT NULL DEFAULT 2,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id"),
    "courseId" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "position" INTEGER NOT NULL
);

CREATE TABLE "Choice" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Choice_pkey" PRIMARY KEY ("id"),
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id"),
    "courseId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "attendedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "score" INTEGER,
    "certificateCode" TEXT
);

CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id"),
    "enrollmentId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "responses" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id"),
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "targetRole" "Role",
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AnnouncementRevision" (
    "id" TEXT NOT NULL,
    CONSTRAINT "AnnouncementRevision_pkey" PRIMARY KEY ("id"),
    "announcementId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "modifiedBy" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id"),
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id"),
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id"),
    "itemId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CustodyEvent" (
    "id" TEXT NOT NULL,
    CONSTRAINT "CustodyEvent_pkey" PRIMARY KEY ("id"),
    "vehicleId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "evidenceKey" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT NOT NULL
);

CREATE TABLE "EvidenceAsset" (
    "id" TEXT NOT NULL,
    CONSTRAINT "EvidenceAsset_pkey" PRIMARY KEY ("id"),
    "key" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "purpose" "EvidencePurpose" NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "User" ADD CONSTRAINT "User_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OdometerReading" ADD CONSTRAINT "OdometerReading_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Clearance" ADD CONSTRAINT "Clearance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Clearance" ADD CONSTRAINT "Clearance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MedicalFitness" ADD CONSTRAINT "MedicalFitness_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Roster" ADD CONSTRAINT "Roster_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Service" ADD CONSTRAINT "Service_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Service" ADD CONSTRAINT "Service_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ServiceEvent" ADD CONSTRAINT "ServiceEvent_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SafetyCase" ADD CONSTRAINT "SafetyCase_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SafetyCase" ADD CONSTRAINT "SafetyCase_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SafetyAction" ADD CONSTRAINT "SafetyAction_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SafetyCase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Contract" ADD CONSTRAINT "Contract_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Question" ADD CONSTRAINT "Question_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Choice" ADD CONSTRAINT "Choice_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AnnouncementRevision" ADD CONSTRAINT "AnnouncementRevision_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Worker_document_key" ON "Worker" ("document");

CREATE INDEX "Worker_area_active_idx" ON "Worker" ("area", "active");

CREATE UNIQUE INDEX "User_workerId_key" ON "User" ("workerId");

CREATE UNIQUE INDEX "User_login_key" ON "User" ("login");

CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session" ("tokenHash");

CREATE INDEX "Session_userId_expiresAt_idx" ON "Session" ("userId", "expiresAt");

CREATE INDEX "AuditLog_entity_entityId_at_idx" ON "AuditLog" ("entity", "entityId", "at");

CREATE UNIQUE INDEX "Owner_document_key" ON "Owner" ("document");

CREATE UNIQUE INDEX "Vehicle_code_key" ON "Vehicle" ("code");

CREATE UNIQUE INDEX "Vehicle_plate_key" ON "Vehicle" ("plate");

CREATE INDEX "Vehicle_ownerId_idx" ON "Vehicle" ("ownerId");

CREATE INDEX "VehicleDocument_vehicleId_kind_expiresAt_idx" ON "VehicleDocument" ("vehicleId", "kind", "expiresAt");

CREATE INDEX "OdometerReading_vehicleId_at_idx" ON "OdometerReading" ("vehicleId", "at");

CREATE INDEX "WorkOrder_vehicleId_status_idx" ON "WorkOrder" ("vehicleId", "status");

CREATE INDEX "Clearance_vehicleId_kind_validUntil_idx" ON "Clearance" ("vehicleId", "kind", "validUntil");

CREATE INDEX "Clearance_workerId_kind_validUntil_idx" ON "Clearance" ("workerId", "kind", "validUntil");

CREATE UNIQUE INDEX "MedicalFitness_workerId_key" ON "MedicalFitness" ("workerId");

CREATE INDEX "Roster_workerId_startsAt_endsAt_idx" ON "Roster" ("workerId", "startsAt", "endsAt");

CREATE UNIQUE INDEX "Service_code_key" ON "Service" ("code");

CREATE INDEX "Service_workerId_startsAt_endsAt_idx" ON "Service" ("workerId", "startsAt", "endsAt");

CREATE INDEX "Service_vehicleId_startsAt_endsAt_idx" ON "Service" ("vehicleId", "startsAt", "endsAt");

CREATE UNIQUE INDEX "ServiceEvent_clientEventId_key" ON "ServiceEvent" ("clientEventId");

CREATE INDEX "ServiceEvent_serviceId_occurredAt_idx" ON "ServiceEvent" ("serviceId", "occurredAt");

CREATE UNIQUE INDEX "Inspection_clientEventId_key" ON "Inspection" ("clientEventId");

CREATE INDEX "Timesheet_workerId_startsAt_endsAt_idx" ON "Timesheet" ("workerId", "startsAt", "endsAt");

CREATE UNIQUE INDEX "SafetyCase_reference_key" ON "SafetyCase" ("reference");

CREATE INDEX "SafetyCase_vehicleId_status_idx" ON "SafetyCase" ("vehicleId", "status");

CREATE UNIQUE INDEX "Question_courseId_position_key" ON "Question" ("courseId", "position");

CREATE UNIQUE INDEX "Enrollment_certificateCode_key" ON "Enrollment" ("certificateCode");

CREATE UNIQUE INDEX "Enrollment_courseId_workerId_key" ON "Enrollment" ("courseId", "workerId");

CREATE UNIQUE INDEX "QuizAttempt_enrollmentId_sequence_key" ON "QuizAttempt" ("enrollmentId", "sequence");

CREATE UNIQUE INDEX "AnnouncementRevision_announcementId_version_key" ON "AnnouncementRevision" ("announcementId", "version");

CREATE UNIQUE INDEX "Receipt_announcementId_userId_version_key" ON "Receipt" ("announcementId", "userId", "version");

CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem" ("sku");

CREATE UNIQUE INDEX "EvidenceAsset_key_key" ON "EvidenceAsset" ("key");

CREATE INDEX "EvidenceAsset_uploadedBy_createdAt_idx" ON "EvidenceAsset" ("uploadedBy", "createdAt");
