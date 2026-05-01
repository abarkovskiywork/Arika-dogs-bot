/*
  Warnings:

  - Added the required column `walksCount` to the `WalkLog` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WalkLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serviceEventId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "slot" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "walksCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalkLog_serviceEventId_fkey" FOREIGN KEY ("serviceEventId") REFERENCES "ServiceEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WalkLog" ("createdAt", "date", "id", "serviceEventId", "slot", "status") SELECT "createdAt", "date", "id", "serviceEventId", "slot", "status" FROM "WalkLog";
DROP TABLE "WalkLog";
ALTER TABLE "new_WalkLog" RENAME TO "WalkLog";
CREATE UNIQUE INDEX "WalkLog_serviceEventId_date_slot_key" ON "WalkLog"("serviceEventId", "date", "slot");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
