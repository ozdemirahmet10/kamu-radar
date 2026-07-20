-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "graduation_department",
ADD COLUMN     "graduation_department_id" TEXT;

-- CreateTable
CREATE TABLE "graduation_departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "education_level" "EducationLevel" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "graduation_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qualification_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "education_level" "EducationLevel" NOT NULL,
    "department_names" JSONB NOT NULL,
    "is_universal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "qualification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "graduation_departments_education_level_idx" ON "graduation_departments"("education_level");

-- CreateIndex
CREATE UNIQUE INDEX "graduation_departments_name_education_level_key" ON "graduation_departments"("name", "education_level");

-- CreateIndex
CREATE UNIQUE INDEX "qualification_codes_code_key" ON "qualification_codes"("code");

-- CreateIndex
CREATE INDEX "qualification_codes_education_level_idx" ON "qualification_codes"("education_level");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_graduation_department_id_fkey" FOREIGN KEY ("graduation_department_id") REFERENCES "graduation_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
