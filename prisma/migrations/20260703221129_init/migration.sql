-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "MilitaryStatus" AS ENUM ('YAPILDI', 'MUAF', 'TECILLI', 'YOK');

-- CreateEnum
CREATE TYPE "DisabilityStatus" AS ENUM ('YOK', 'VAR');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WEB_PUSH', 'MOBILE_PUSH');

-- CreateEnum
CREATE TYPE "DigestFrequency" AS ENUM ('INSTANT', 'DAILY');

-- CreateEnum
CREATE TYPE "CrawlStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "JobPostingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'EXPIRED', 'ARCHIVED', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('CERTIFICATE', 'DRIVING_LICENSE', 'YDS', 'EXPERIENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "EligibilityStatus" AS ENUM ('ELIGIBLE', 'PARTIALLY_ELIGIBLE', 'NOT_ELIGIBLE');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "device_info" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "graduation_school" TEXT,
    "graduation_department" TEXT,
    "kpss_year" INTEGER,
    "kpss_score_type" TEXT,
    "kpss_score" DOUBLE PRECISION,
    "driving_license" BOOLEAN NOT NULL DEFAULT false,
    "yds_score" DOUBLE PRECISION,
    "yds_type" TEXT,
    "military_status" "MilitaryStatus",
    "disability_status" "DisabilityStatus" DEFAULT 'YOK',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_certificates" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "certificate_name" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3),

    CONSTRAINT "user_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferred_cities" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,

    CONSTRAINT "user_preferred_cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plate_code" INTEGER NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "digest_frequency" "DigestFrequency" NOT NULL DEFAULT 'INSTANT',

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "adapter_key" TEXT NOT NULL,
    "crawl_frequency_cron" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_crawled_at" TIMESTAMP(3),
    "last_status" "CrawlStatus",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crawl_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_runs" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "status" "CrawlStatus" NOT NULL,
    "items_found" INTEGER NOT NULL DEFAULT 0,
    "items_new" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,

    CONSTRAINT "crawl_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_postings" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "external_ref" TEXT,
    "fingerprint_hash" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "position_title" TEXT NOT NULL,
    "city_id" TEXT,
    "quota_count" INTEGER,
    "kpss_score_type" TEXT,
    "min_kpss_score" DOUBLE PRECISION,
    "min_age" INTEGER,
    "max_age" INTEGER,
    "requires_experience" BOOLEAN NOT NULL DEFAULT false,
    "application_start_date" TIMESTAMP(3),
    "application_end_date" TIMESTAMP(3),
    "application_url" TEXT,
    "raw_text" TEXT,
    "parsing_confidence" DOUBLE PRECISION,
    "status" "JobPostingStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_posting_qualification_codes" (
    "id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "job_posting_qualification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_posting_departments" (
    "id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "department_name" TEXT NOT NULL,

    CONSTRAINT "job_posting_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_posting_requirements" (
    "id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "requirement_type" "RequirementType" NOT NULL,
    "requirement_value" JSONB NOT NULL,

    CONSTRAINT "job_posting_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_posting_versions" (
    "id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_reason" TEXT,

    CONSTRAINT "job_posting_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_results" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "eligibility_status" "EligibilityStatus" NOT NULL,
    "missing_criteria" JSONB,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_posting_id" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "payload" JSONB,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "changes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_certificates_user_profile_id_idx" ON "user_certificates"("user_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferred_cities_user_profile_id_city_id_key" ON "user_preferred_cities"("user_profile_id", "city_id");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_key" ON "cities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cities_plate_code_key" ON "cities"("plate_code");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_channel_key" ON "notification_preferences"("user_id", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "crawl_sources_name_key" ON "crawl_sources"("name");

-- CreateIndex
CREATE INDEX "crawl_runs_source_id_idx" ON "crawl_runs"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_postings_fingerprint_hash_key" ON "job_postings"("fingerprint_hash");

-- CreateIndex
CREATE INDEX "job_postings_kpss_score_type_city_id_status_idx" ON "job_postings"("kpss_score_type", "city_id", "status");

-- CreateIndex
CREATE INDEX "job_posting_qualification_codes_job_posting_id_idx" ON "job_posting_qualification_codes"("job_posting_id");

-- CreateIndex
CREATE INDEX "job_posting_departments_job_posting_id_idx" ON "job_posting_departments"("job_posting_id");

-- CreateIndex
CREATE INDEX "job_posting_requirements_job_posting_id_idx" ON "job_posting_requirements"("job_posting_id");

-- CreateIndex
CREATE INDEX "job_posting_versions_job_posting_id_idx" ON "job_posting_versions"("job_posting_id");

-- CreateIndex
CREATE INDEX "match_results_user_id_eligibility_status_idx" ON "match_results"("user_id", "eligibility_status");

-- CreateIndex
CREATE UNIQUE INDEX "match_results_user_id_job_posting_id_key" ON "match_results"("user_id", "job_posting_id");

-- CreateIndex
CREATE INDEX "notification_logs_user_id_idx" ON "notification_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_certificates" ADD CONSTRAINT "user_certificates_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_cities" ADD CONSTRAINT "user_preferred_cities_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_cities" ADD CONSTRAINT "user_preferred_cities_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crawl_runs" ADD CONSTRAINT "crawl_runs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "crawl_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "crawl_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting_qualification_codes" ADD CONSTRAINT "job_posting_qualification_codes_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting_departments" ADD CONSTRAINT "job_posting_departments_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting_requirements" ADD CONSTRAINT "job_posting_requirements_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting_versions" ADD CONSTRAINT "job_posting_versions_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
