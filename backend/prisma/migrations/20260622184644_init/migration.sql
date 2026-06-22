/*
  Warnings:

  - You are about to drop the column `createdAt` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Workspace` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "createdAt",
DROP COLUMN "language";

-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "name";
