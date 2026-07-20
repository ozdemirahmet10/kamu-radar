-- CreateTable
CREATE TABLE "job_posting_favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_posting_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_posting_favorites_user_id_idx" ON "job_posting_favorites"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_posting_favorites_user_id_job_posting_id_key" ON "job_posting_favorites"("user_id", "job_posting_id");

-- AddForeignKey
ALTER TABLE "job_posting_favorites" ADD CONSTRAINT "job_posting_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting_favorites" ADD CONSTRAINT "job_posting_favorites_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
