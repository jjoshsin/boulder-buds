-- AlterTable
ALTER TABLE "users" ADD COLUMN     "expoPushToken" TEXT,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- CreateTable
CREATE TABLE "climb_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "climbType" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "climb_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "climb_logs_userId_idx" ON "climb_logs"("userId");

-- CreateIndex
CREATE INDEX "climb_logs_gymId_idx" ON "climb_logs"("gymId");

-- AddForeignKey
ALTER TABLE "climb_logs" ADD CONSTRAINT "climb_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "climb_logs" ADD CONSTRAINT "climb_logs_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
