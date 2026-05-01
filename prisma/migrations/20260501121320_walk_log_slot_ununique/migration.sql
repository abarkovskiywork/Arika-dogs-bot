/*
  Warnings:

  - A unique constraint covering the columns `[serviceEventId,date]` on the table `WalkLog` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "WalkLog_serviceEventId_date_slot_key";

-- CreateIndex
CREATE UNIQUE INDEX "WalkLog_serviceEventId_date_key" ON "WalkLog"("serviceEventId", "date");
