-- AlterTable
ALTER TABLE "gyms" ADD COLUMN     "dayPassPrice" DOUBLE PRECISION,
ADD COLUMN     "monthlyMembershipPrice" DOUBLE PRECISION,
ADD COLUMN     "studentDiscountAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "studentDiscountDetails" TEXT;
