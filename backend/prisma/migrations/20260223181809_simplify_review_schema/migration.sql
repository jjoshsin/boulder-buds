-- Step 1: Add new columns with default values
ALTER TABLE "reviews"
ADD COLUMN "setting" TEXT NOT NULL DEFAULT 'balanced';
ALTER TABLE "reviews"
ADD COLUMN "difficulty_new" TEXT NOT NULL DEFAULT 'accurate';
-- Step 2: Drop old columns
ALTER TABLE "reviews" DROP COLUMN "settingQuality";
ALTER TABLE "reviews" DROP COLUMN "difficulty";
ALTER TABLE "reviews" DROP COLUMN "variety";
ALTER TABLE "reviews" DROP COLUMN "crowding";
ALTER TABLE "reviews" DROP COLUMN "cleanliness";
ALTER TABLE "reviews" DROP COLUMN "vibe";
ALTER TABLE "reviews" DROP COLUMN "tags";
-- Step 3: Rename difficulty_new to difficulty
ALTER TABLE "reviews"
  RENAME COLUMN "difficulty_new" TO "difficulty";