/*
  Warnings:

  - You are about to drop the column `photos` on the `gyms` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "gyms" DROP COLUMN "photos",
ADD COLUMN     "officialPhotos" TEXT[];

-- CreateTable
CREATE TABLE "community_photos" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_photos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "community_photos" ADD CONSTRAINT "community_photos_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_photos" ADD CONSTRAINT "community_photos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
