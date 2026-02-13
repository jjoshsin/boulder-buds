-- CreateTable
CREATE TABLE "photo_likes" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "photo_likes_photoId_userId_key" ON "photo_likes"("photoId", "userId");

-- AddForeignKey
ALTER TABLE "photo_likes" ADD CONSTRAINT "photo_likes_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "community_photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_likes" ADD CONSTRAINT "photo_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
