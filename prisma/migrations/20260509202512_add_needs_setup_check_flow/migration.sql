-- DropIndex
DROP INDEX "WalkLog_serviceEventId_date_key";

-- AlterTable
ALTER TABLE "WalkLog" ADD COLUMN "completed" BOOLEAN;

-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "digestTime" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServiceEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "googleEventId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "dogName" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "walksPerDay" INTEGER NOT NULL DEFAULT 1,
    "trackingMode" TEXT NOT NULL DEFAULT 'auto_done',
    "checkTime" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "needsSetup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ServiceEvent" ("calendarId", "checkTime", "createdAt", "dogName", "endDate", "googleEventId", "id", "isActive", "price", "serviceType", "startDate", "trackingMode", "walksPerDay") SELECT "calendarId", "checkTime", "createdAt", "dogName", "endDate", "googleEventId", "id", "isActive", "price", "serviceType", "startDate", "trackingMode", "walksPerDay" FROM "ServiceEvent";
DROP TABLE "ServiceEvent";
ALTER TABLE "new_ServiceEvent" RENAME TO "ServiceEvent";
CREATE UNIQUE INDEX "ServiceEvent_googleEventId_key" ON "ServiceEvent"("googleEventId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
