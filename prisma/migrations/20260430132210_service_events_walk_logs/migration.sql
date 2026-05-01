-- CreateTable
CREATE TABLE "ServiceEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "googleEventId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "dogName" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "walksPerDay" INTEGER NOT NULL DEFAULT 1,
    "trackingMode" TEXT NOT NULL DEFAULT 'auto_done',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WalkLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serviceEventId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "slot" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalkLog_serviceEventId_fkey" FOREIGN KEY ("serviceEventId") REFERENCES "ServiceEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceEvent_googleEventId_key" ON "ServiceEvent"("googleEventId");

-- CreateIndex
CREATE UNIQUE INDEX "WalkLog_serviceEventId_date_slot_key" ON "WalkLog"("serviceEventId", "date", "slot");
