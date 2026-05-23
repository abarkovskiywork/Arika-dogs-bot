/*
  Warnings:

  - You are about to drop the column `checkTime` on the `ServiceEvent` table. All the data in the column will be lost.

*/
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
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "needsSetup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ServiceEvent" ("calendarId", "createdAt", "dogName", "endDate", "googleEventId", "id", "isActive", "needsSetup", "price", "serviceType", "startDate", "trackingMode", "walksPerDay") SELECT "calendarId", "createdAt", "dogName", "endDate", "googleEventId", "id", "isActive", "needsSetup", "price", "serviceType", "startDate", "trackingMode", "walksPerDay" FROM "ServiceEvent";
DROP TABLE "ServiceEvent";
ALTER TABLE "new_ServiceEvent" RENAME TO "ServiceEvent";
CREATE UNIQUE INDEX "ServiceEvent_googleEventId_key" ON "ServiceEvent"("googleEventId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
