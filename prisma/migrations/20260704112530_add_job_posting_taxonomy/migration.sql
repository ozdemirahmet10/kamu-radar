-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('BAKANLIK', 'BELEDIYE', 'UNIVERSITE', 'VALILIK', 'IL_MUDURLUGU', 'KAYMAKAMLIK', 'DIGER');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('SUREKLI_ISCI', 'MEMUR', 'SOZLESMELI_PERSONEL', 'GECICI_PERSONEL');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('ILKOGRETIM', 'LISE', 'ON_LISANS', 'LISANS', 'YUKSEK_LISANS');

-- AlterTable
ALTER TABLE "job_postings" ADD COLUMN     "description" TEXT,
ADD COLUMN     "employment_type" "EmploymentType",
ADD COLUMN     "institution_type" "InstitutionType",
ADD COLUMN     "minimum_education_level" "EducationLevel";

-- CreateIndex
CREATE INDEX "job_postings_institution_type_employment_type_minimum_educa_idx" ON "job_postings"("institution_type", "employment_type", "minimum_education_level");
