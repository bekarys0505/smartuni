-- AlterTable
ALTER TABLE "Test" ADD COLUMN "scheduledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Test_scheduledAt_idx" ON "Test"("scheduledAt");

