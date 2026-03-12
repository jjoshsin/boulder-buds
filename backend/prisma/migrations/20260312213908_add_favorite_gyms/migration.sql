-- CreateTable
CREATE TABLE "favorite_gyms" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "listType" TEXT NOT NULL DEFAULT 'favorites',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_gyms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorite_gyms_userId_idx" ON "favorite_gyms"("userId");

-- CreateIndex
CREATE INDEX "favorite_gyms_gymId_idx" ON "favorite_gyms"("gymId");

-- CreateIndex
CREATE INDEX "favorite_gyms_listType_idx" ON "favorite_gyms"("listType");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_gyms_userId_gymId_listType_key" ON "favorite_gyms"("userId", "gymId", "listType");

-- AddForeignKey
ALTER TABLE "favorite_gyms" ADD CONSTRAINT "favorite_gyms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_gyms" ADD CONSTRAINT "favorite_gyms_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
