-- Migración aditiva. No modifica ni elimina registros anteriores.
CREATE TABLE "ActivePause" (
    "id" TEXT NOT NULL,
    "clientEventId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "serviceId" TEXT,
    "vehicleId" TEXT,
    "evidenceKey" TEXT,
    "status" TEXT NOT NULL,
    "plannedMinutes" INTEGER NOT NULL DEFAULT 5,
    "startedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "missedReason" TEXT,
    "registeredBy" TEXT NOT NULL,
    "workerName" TEXT NOT NULL,
    "unitCode" TEXT,
    "plate" TEXT,
    "serviceCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivePause_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ActivePause_evidenceKey_key" ON "ActivePause"("evidenceKey");
CREATE UNIQUE INDEX "ActivePause_clientEventId_key" ON "ActivePause"("clientEventId");
CREATE INDEX "ActivePause_workerId_createdAt_idx" ON "ActivePause"("workerId", "createdAt");
CREATE INDEX "ActivePause_serviceId_createdAt_idx" ON "ActivePause"("serviceId", "createdAt");
ALTER TABLE "ActivePause" ADD CONSTRAINT "ActivePause_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActivePause" ADD CONSTRAINT "ActivePause_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActivePause" ADD CONSTRAINT "ActivePause_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
