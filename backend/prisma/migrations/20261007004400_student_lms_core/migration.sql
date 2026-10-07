-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('LECTURE', 'VIDEO', 'ADDITIONAL_RESOURCE');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('UNREAD', 'STARTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "MaterialType" NOT NULL DEFAULT 'LECTURE',
    "contentUrl" TEXT,
    "contentText" TEXT,
    "order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentMaterialProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'UNREAD',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentMaterialProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Topic_subjectId_idx" ON "Topic"("subjectId");

-- CreateIndex
CREATE INDEX "Topic_order_idx" ON "Topic"("order");

-- CreateIndex
CREATE INDEX "Material_topicId_idx" ON "Material"("topicId");

-- CreateIndex
CREATE INDEX "Material_order_idx" ON "Material"("order");

-- CreateIndex
CREATE INDEX "StudentMaterialProgress_studentId_idx" ON "StudentMaterialProgress"("studentId");

-- CreateIndex
CREATE INDEX "StudentMaterialProgress_materialId_idx" ON "StudentMaterialProgress"("materialId");

-- CreateIndex
CREATE INDEX "StudentMaterialProgress_status_idx" ON "StudentMaterialProgress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StudentMaterialProgress_studentId_materialId_key" ON "StudentMaterialProgress"("studentId", "materialId");

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMaterialProgress" ADD CONSTRAINT "StudentMaterialProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMaterialProgress" ADD CONSTRAINT "StudentMaterialProgress_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

