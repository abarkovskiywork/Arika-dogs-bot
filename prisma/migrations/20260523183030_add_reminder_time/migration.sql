-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserSettings" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "digestTime" TEXT NOT NULL DEFAULT '09:00',
    "reminderTime" TEXT NOT NULL DEFAULT '22:00'
);
INSERT INTO "new_UserSettings" ("digestTime", "userId") SELECT "digestTime", "userId" FROM "UserSettings";
DROP TABLE "UserSettings";
ALTER TABLE "new_UserSettings" RENAME TO "UserSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
