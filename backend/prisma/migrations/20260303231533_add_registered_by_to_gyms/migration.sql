/*
  Warnings:

  - The `birthday` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "gyms" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'USA',
ADD COLUMN     "hasBouldering" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hasRopeClimbing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registeredBy" TEXT,
ALTER COLUMN "amenities" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "priceRange" DROP NOT NULL,
ALTER COLUMN "priceRange" SET DATA TYPE TEXT,
ALTER COLUMN "climbingTypes" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "officialPhotos" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "users" DROP COLUMN "birthday",
ADD COLUMN     "birthday" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "gyms" ADD CONSTRAINT "gyms_registeredBy_fkey" FOREIGN KEY ("registeredBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
