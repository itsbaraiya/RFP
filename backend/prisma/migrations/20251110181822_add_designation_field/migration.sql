-- CreateEnum
CREATE TYPE "public"."RFPStatus" AS ENUM ('PENDING', 'ANALYZED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."CollaboratorStatus" AS ENUM ('INVITED', 'ACCEPTED', 'REVOKED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "designation" TEXT DEFAULT '';

-- CreateTable
CREATE TABLE "public"."RFP" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "filePath" TEXT NOT NULL,
    "status" "public"."RFPStatus" NOT NULL DEFAULT 'PENDING',
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Question" (
    "id" SERIAL NOT NULL,
    "rfpId" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "aiSuggestedAnswer" TEXT,
    "userEditedAnswer" TEXT,
    "section" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RFPCollaborator" (
    "id" SERIAL NOT NULL,
    "rfpId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT DEFAULT 'Collaborator',
    "status" "public"."CollaboratorStatus" NOT NULL DEFAULT 'INVITED',
    "inviteToken" TEXT,
    "invitedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "RFPCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RFPCollaborator_rfpId_userId_key" ON "public"."RFPCollaborator"("rfpId", "userId");

-- AddForeignKey
ALTER TABLE "public"."RFP" ADD CONSTRAINT "RFP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "public"."RFP"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RFPCollaborator" ADD CONSTRAINT "RFPCollaborator_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "public"."RFP"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RFPCollaborator" ADD CONSTRAINT "RFPCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
