-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'NEW_FROM_FOLLOWED_INSTITUTION';

-- CreateTable
CREATE TABLE "institution_follows" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institution_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_feedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "is_accurate" BOOLEAN NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "institution_follows_user_id_idx" ON "institution_follows"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "institution_follows_user_id_institution_name_key" ON "institution_follows"("user_id", "institution_name");

-- CreateIndex
CREATE INDEX "match_feedback_job_posting_id_idx" ON "match_feedback"("job_posting_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_feedback_user_id_job_posting_id_key" ON "match_feedback"("user_id", "job_posting_id");

-- AddForeignKey
ALTER TABLE "institution_follows" ADD CONSTRAINT "institution_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_feedback" ADD CONSTRAINT "match_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_feedback" ADD CONSTRAINT "match_feedback_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
