/*
  Warnings:

  - The primary key for the `Message` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `Id` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `room_id` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `room_id` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `JoinedAt` on the `RoomMember` table. All the data in the column will be lost.
  - You are about to drop the column `room_id` on the `RoomMember` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `RoomMember` table. All the data in the column will be lost.
  - You are about to drop the column `UserName` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,roomId]` on the table `RoomMember` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `roomId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomId` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomId` to the `RoomMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `RoomMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_room_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Room" DROP CONSTRAINT "Room_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."RoomMember" DROP CONSTRAINT "RoomMember_room_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."RoomMember" DROP CONSTRAINT "RoomMember_user_id_fkey";

-- DropIndex
DROP INDEX "public"."RoomMember_user_id_room_id_key";

-- DropIndex
DROP INDEX "public"."User_UserName_key";

-- AlterTable
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_pkey",
DROP COLUMN "Id",
DROP COLUMN "room_id",
DROP COLUMN "user_id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "roomId" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "Message_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Room" DROP COLUMN "created_by",
DROP COLUMN "room_id",
ADD COLUMN     "createdBy" INTEGER NOT NULL,
ADD COLUMN     "roomId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."RoomMember" DROP COLUMN "JoinedAt",
DROP COLUMN "room_id",
DROP COLUMN "user_id",
ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "roomId" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "UserName",
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RoomMember_userId_roomId_key" ON "public"."RoomMember"("userId", "roomId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- AddForeignKey
ALTER TABLE "public"."Room" ADD CONSTRAINT "Room_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoomMember" ADD CONSTRAINT "RoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoomMember" ADD CONSTRAINT "RoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
