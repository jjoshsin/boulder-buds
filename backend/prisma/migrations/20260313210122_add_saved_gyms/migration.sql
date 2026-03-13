/*
  Warnings:

  - You are about to drop the `favorite_gyms` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "favorite_gyms" DROP CONSTRAINT "favorite_gyms_gymId_fkey";

-- DropForeignKey
ALTER TABLE "favorite_gyms" DROP CONSTRAINT "favorite_gyms_userId_fkey";

-- DropTable
DROP TABLE "favorite_gyms";

-- CreateTable
CREATE TABLE "saved_gyms" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_gyms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_gyms_userId_idx" ON "saved_gyms"("userId");

-- CreateIndex
CREATE INDEX "saved_gyms_gymId_idx" ON "saved_gyms"("gymId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_gyms_userId_gymId_key" ON "saved_gyms"("userId", "gymId");

-- AddForeignKey
ALTER TABLE "saved_gyms" ADD CONSTRAINT "saved_gyms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_gyms" ADD CONSTRAINT "saved_gyms_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
