-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_MATCH', 'DEADLINE_SOON');

-- AlterEnum
ALTER TYPE "NotificationChannel" ADD VALUE 'IN_APP';

-- DropIndex
DROP INDEX "notification_logs_user_id_idx";

-- AlterTable
ALTER TABLE "notification_logs" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "type" "NotificationType" NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'SENT';

-- CreateIndex
CREATE INDEX "notification_logs_user_id_created_at_idx" ON "notification_logs"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_logs_user_id_job_posting_id_type_key" ON "notification_logs"("user_id", "job_posting_id", "type");
