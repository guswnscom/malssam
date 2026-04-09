-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255),
    "auth_provider" VARCHAR(20) NOT NULL DEFAULT 'email',
    "auth_provider_id" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "churches" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "denomination" VARCHAR(50) NOT NULL DEFAULT '대한예수교장로회',
    "size_category" VARCHAR(20) NOT NULL,
    "invite_code" VARCHAR(20) NOT NULL,
    "invite_code_expires_at" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "churches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "church_profiles" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "sermon_style" VARCHAR(20) NOT NULL DEFAULT 'BALANCED',
    "congregation_type" VARCHAR(20) NOT NULL DEFAULT 'ADULT',
    "worship_types" TEXT[] DEFAULT ARRAY['SUNDAY']::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "church_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worship_schedules" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "day_of_week" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worship_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sermon_requests" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "worship_type" VARCHAR(20) NOT NULL,
    "target_date" DATE NOT NULL,
    "scripture" VARCHAR(100) NOT NULL,
    "depth" VARCHAR(10) NOT NULL DEFAULT 'MODERATE',
    "target_audience" VARCHAR(10) NOT NULL DEFAULT 'ALL',
    "special_instruction" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'generating',
    "ai_model" VARCHAR(50),
    "ai_tokens_used" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sermon_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sermon_drafts" (
    "id" UUID NOT NULL,
    "sermon_request_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "scripture" VARCHAR(100) NOT NULL,
    "summary" TEXT NOT NULL,
    "introduction" TEXT NOT NULL,
    "outline" JSONB NOT NULL,
    "application" TEXT NOT NULL,
    "conclusion" TEXT NOT NULL,
    "regeneration_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sermon_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citations" (
    "id" UUID NOT NULL,
    "sermon_draft_id" UUID NOT NULL,
    "citation_type" VARCHAR(20) NOT NULL,
    "source_author" VARCHAR(100),
    "source_title" VARCHAR(200),
    "source_info" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prayer_topics" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prayer_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "plan" VARCHAR(10) NOT NULL DEFAULT 'SEED',
    "status" VARCHAR(20) NOT NULL DEFAULT 'trial',
    "trial_start" DATE NOT NULL,
    "trial_end" DATE NOT NULL,
    "billing_start" DATE,
    "monthly_price" INTEGER,
    "max_pastors" INTEGER NOT NULL DEFAULT 3,
    "max_sermons_month" INTEGER NOT NULL DEFAULT 20,
    "pg_billing_key" VARCHAR(255),
    "card_last_four" VARCHAR(4),
    "card_brand" VARCHAR(20),
    "next_billing_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "churches_invite_code_key" ON "churches"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "church_profiles_church_id_key" ON "church_profiles"("church_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_user_id_church_id_key" ON "memberships"("user_id", "church_id");

-- CreateIndex
CREATE INDEX "sermon_requests_church_id_target_date_idx" ON "sermon_requests"("church_id", "target_date" DESC);

-- CreateIndex
CREATE INDEX "sermon_requests_user_id_idx" ON "sermon_requests"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sermon_drafts_sermon_request_id_key" ON "sermon_drafts"("sermon_request_id");

-- CreateIndex
CREATE INDEX "citations_sermon_draft_id_idx" ON "citations"("sermon_draft_id");

-- CreateIndex
CREATE INDEX "prayer_topics_church_id_created_at_idx" ON "prayer_topics"("church_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_church_id_key" ON "subscriptions"("church_id");

-- AddForeignKey
ALTER TABLE "church_profiles" ADD CONSTRAINT "church_profiles_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worship_schedules" ADD CONSTRAINT "worship_schedules_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sermon_requests" ADD CONSTRAINT "sermon_requests_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sermon_requests" ADD CONSTRAINT "sermon_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sermon_drafts" ADD CONSTRAINT "sermon_drafts_sermon_request_id_fkey" FOREIGN KEY ("sermon_request_id") REFERENCES "sermon_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citations" ADD CONSTRAINT "citations_sermon_draft_id_fkey" FOREIGN KEY ("sermon_draft_id") REFERENCES "sermon_drafts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_topics" ADD CONSTRAINT "prayer_topics_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_topics" ADD CONSTRAINT "prayer_topics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
