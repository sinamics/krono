/*
  Warnings:

  - You are about to drop the column `userId` on the `businessSettings` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `integration` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `mvaTerm` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `supplier` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `transaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[organizationId]` on the table `businessSettings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,provider]` on the table `integration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,year,term]` on the table `mvaTerm` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,externalId]` on the table `transaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,bilagsnummer]` on the table `transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `businessSettings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `integration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `mvaTerm` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "businessSettings" DROP CONSTRAINT "businessSettings_userId_fkey";

-- DropForeignKey
ALTER TABLE "integration" DROP CONSTRAINT "integration_userId_fkey";

-- DropForeignKey
ALTER TABLE "mvaTerm" DROP CONSTRAINT "mvaTerm_userId_fkey";

-- DropForeignKey
ALTER TABLE "supplier" DROP CONSTRAINT "supplier_userId_fkey";

-- DropForeignKey
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_userId_fkey";

-- DropIndex
DROP INDEX "businessSettings_userId_key";

-- DropIndex
DROP INDEX "integration_userId_provider_key";

-- DropIndex
DROP INDEX "mvaTerm_userId_year_term_key";

-- DropIndex
DROP INDEX "transaction_userId_bilagsnummer_key";

-- DropIndex
DROP INDEX "transaction_userId_externalId_key";

-- AlterTable
ALTER TABLE "businessSettings" DROP COLUMN "userId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "integration" DROP COLUMN "userId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "mvaTerm" DROP COLUMN "userId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "supplier" DROP COLUMN "userId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "transaction" DROP COLUMN "userId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "appSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizationMember_organizationId_userId_key" ON "organizationMember"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "appSettings_key_key" ON "appSettings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "businessSettings_organizationId_key" ON "businessSettings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_organizationId_provider_key" ON "integration"("organizationId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "mvaTerm_organizationId_year_term_key" ON "mvaTerm"("organizationId", "year", "term");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_organizationId_externalId_key" ON "transaction"("organizationId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_organizationId_bilagsnummer_key" ON "transaction"("organizationId", "bilagsnummer");

-- AddForeignKey
ALTER TABLE "organizationMember" ADD CONSTRAINT "organizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizationMember" ADD CONSTRAINT "organizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditLog" ADD CONSTRAINT "auditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mvaTerm" ADD CONSTRAINT "mvaTerm_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration" ADD CONSTRAINT "integration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businessSettings" ADD CONSTRAINT "businessSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
