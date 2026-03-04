/*
  Warnings:

  - A unique constraint covering the columns `[userId,bilagsnummer]` on the table `transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "supplier" ADD COLUMN     "vatId" TEXT;

-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "bilagsnummer" INTEGER,
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "auditLog" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auditLog_transactionId_idx" ON "auditLog"("transactionId");

-- CreateIndex
CREATE INDEX "auditLog_userId_idx" ON "auditLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_userId_bilagsnummer_key" ON "transaction"("userId", "bilagsnummer");

-- AddForeignKey
ALTER TABLE "auditLog" ADD CONSTRAINT "auditLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
