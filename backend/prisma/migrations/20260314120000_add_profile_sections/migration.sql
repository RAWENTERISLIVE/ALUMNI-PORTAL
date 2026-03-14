-- AlterTable
ALTER TABLE "User"
ADD COLUMN "experiences" JSONB,
ADD COLUMN "educations" JSONB,
ADD COLUMN "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "interests" TEXT[] DEFAULT ARRAY[]::TEXT[];
