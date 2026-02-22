-- CreateTable
CREATE TABLE "Broadcast" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "mediaFileId" TEXT,
    "mediaType" TEXT,
    "targetAudience" TEXT NOT NULL,
    "filterGender" TEXT,
    "filterEditingSkill" TEXT,
    "filterHasExperience" BOOLEAN,
    "filterNiche" TEXT,
    "filterStatus" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Broadcast" ADD CONSTRAINT "Broadcast_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
