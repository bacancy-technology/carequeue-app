-- AlterTable
ALTER TABLE "password_reset_tokens" ADD COLUMN     "isInvite" BOOLEAN NOT NULL DEFAULT false;
