/*
  Warnings:

  - You are about to drop the column `slot` on the `WalkLog` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `WalkLog` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WalkLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serviceEventId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "walksCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalkLog_serviceEventId_fkey" FOREIGN KEY ("serviceEventId") REFERENCES "ServiceEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WalkLog" ("createdAt", "date", "id", "serviceEventId", "walksCount") SELECT "createdAt", "date", "id", "serviceEventId", "walksCount" FROM "WalkLog";
DROP TABLE "WalkLog";
ALTER TABLE "new_WalkLog" RENAME TO "WalkLog";
CREATE UNIQUE INDEX "WalkLog_serviceEventId_date_key" ON "WalkLog"("serviceEventId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
