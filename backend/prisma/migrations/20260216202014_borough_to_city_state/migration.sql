/*
 Warnings:
 
 - You are about to drop the column `borough` on the `gyms` table. All the data in the column will be lost.
 - You are about to drop the column `borough` on the `users` table. All the data in the column will be lost.
 - Added the required column `city` to the `gyms` table without a default value. This is not possible if the table is not empty.
 - Added the required column `state` to the `gyms` table without a default value. This is not possible if the table is not empty.
 
 */
-- Add city and state with default values first
ALTER TABLE "gyms"
ADD COLUMN "city" TEXT NOT NULL DEFAULT '';
ALTER TABLE "gyms"
ADD COLUMN "state" TEXT NOT NULL DEFAULT '';
-- Drop borough column
ALTER TABLE "gyms" DROP COLUMN "borough";
-- Update users table
ALTER TABLE "users"
ADD COLUMN "city" TEXT;
ALTER TABLE "users"
ADD COLUMN "state" TEXT;
ALTER TABLE "users" DROP COLUMN "borough";