/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,provider,name]` on the table `integration` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "integration_organizationId_provider_key";

-- AlterTable
ALTER TABLE "integration" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Standard';

-- CreateIndex
CREATE UNIQUE INDEX "integration_organizationId_provider_name_key" ON "integration"("organizationId", "provider", "name");
