-- DropForeignKey
ALTER TABLE "Clearance" DROP CONSTRAINT "Clearance_vehicleId_fkey";

-- DropForeignKey
ALTER TABLE "Clearance" DROP CONSTRAINT "Clearance_workerId_fkey";

-- DropForeignKey
ALTER TABLE "SafetyCase" DROP CONSTRAINT "SafetyCase_vehicleId_fkey";

-- DropForeignKey
ALTER TABLE "SafetyCase" DROP CONSTRAINT "SafetyCase_workerId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_vehicleId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_workerId_fkey";

-- DropForeignKey
ALTER TABLE "Timesheet" DROP CONSTRAINT "Timesheet_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_workerId_fkey";

-- DropForeignKey
ALTER TABLE "Vehicle" DROP CONSTRAINT "Vehicle_ownerId_fkey";

-- AlterTable
ALTER TABLE "Clearance" ALTER COLUMN "scope" SET DEFAULT 'MINA';

-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "area" SET DEFAULT 'SSOMA';

-- AlterTable
ALTER TABLE "Roster" ALTER COLUMN "status" SET DEFAULT 'BORRADOR';

-- AlterTable
ALTER TABLE "SafetyAction" ALTER COLUMN "status" SET DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "SafetyCase" ALTER COLUMN "status" SET DEFAULT 'ABIERTO';

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "status" SET DEFAULT 'PLANIFICADO';

-- AlterTable
ALTER TABLE "Timesheet" ALTER COLUMN "status" SET DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "WorkOrder" ALTER COLUMN "status" SET DEFAULT 'ABIERTA';

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clearance" ADD CONSTRAINT "Clearance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clearance" ADD CONSTRAINT "Clearance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyCase" ADD CONSTRAINT "SafetyCase_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyCase" ADD CONSTRAINT "SafetyCase_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
