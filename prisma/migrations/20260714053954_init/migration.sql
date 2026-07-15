-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'analyst', 'admin');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('success', 'error', 'refused', 'timeout');

-- CreateEnum
CREATE TYPE "ClassificationStatus" AS ENUM ('pending', 'processing', 'done', 'failed', 'skipped');

-- CreateEnum
CREATE TYPE "ModelRole" AS ENUM ('chat', 'classifier', 'both');

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content_masked" TEXT NOT NULL,
    "content" TEXT,
    "sequence_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "request_message_id" TEXT,
    "response_message_id" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "is_local" BOOLEAN NOT NULL DEFAULT true,
    "prompt_masked" TEXT NOT NULL,
    "response_masked" TEXT,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "estimated_cost" DECIMAL(10,6),
    "latency_ms" INTEGER,
    "status" "RequestStatus" NOT NULL,
    "error_code" TEXT,
    "error_message" TEXT,
    "classification_status" "ClassificationStatus" NOT NULL DEFAULT 'pending',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_classifications" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "business_category" TEXT NOT NULL,
    "usage_purpose" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "improvement_type" TEXT NOT NULL,
    "automation_potential" TEXT NOT NULL,
    "rag_candidate" BOOLEAN NOT NULL,
    "sensitivity_level" TEXT NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "classifier_provider" TEXT NOT NULL,
    "classifier_model" TEXT NOT NULL,
    "classification_version" TEXT NOT NULL,
    "raw_result" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_options" (
    "id" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_settings" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "api_key_ref" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_local" BOOLEAN NOT NULL DEFAULT true,
    "input_cost_per_1k" DECIMAL(10,6),
    "output_cost_per_1k" DECIMAL(10,6),
    "role" "ModelRole" NOT NULL DEFAULT 'chat',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_statistics" (
    "id" TEXT NOT NULL,
    "aggregation_date" DATE NOT NULL,
    "department_id" TEXT NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "active_user_count" INTEGER NOT NULL DEFAULT 0,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "average_latency_ms" INTEGER,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_category_statistics" (
    "id" TEXT NOT NULL,
    "aggregation_date" DATE NOT NULL,
    "department_id" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_category_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "chat_sessions_user_id_idx" ON "chat_sessions"("user_id");

-- CreateIndex
CREATE INDEX "chat_messages_session_id_sequence_number_idx" ON "chat_messages"("session_id", "sequence_number");

-- CreateIndex
CREATE INDEX "ai_requests_created_at_idx" ON "ai_requests"("created_at");

-- CreateIndex
CREATE INDEX "ai_requests_department_id_created_at_idx" ON "ai_requests"("department_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_requests_user_id_created_at_idx" ON "ai_requests"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_requests_classification_status_next_attempt_at_idx" ON "ai_requests"("classification_status", "next_attempt_at");

-- CreateIndex
CREATE UNIQUE INDEX "request_classifications_request_id_key" ON "request_classifications"("request_id");

-- CreateIndex
CREATE INDEX "request_classifications_business_category_idx" ON "request_classifications"("business_category");

-- CreateIndex
CREATE INDEX "request_classifications_rag_candidate_idx" ON "request_classifications"("rag_candidate");

-- CreateIndex
CREATE INDEX "request_classifications_automation_potential_idx" ON "request_classifications"("automation_potential");

-- CreateIndex
CREATE UNIQUE INDEX "category_options_dimension_value_key" ON "category_options"("dimension", "value");

-- CreateIndex
CREATE UNIQUE INDEX "daily_statistics_aggregation_date_department_id_key" ON "daily_statistics"("aggregation_date", "department_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_category_statistics_aggregation_date_department_id_di_key" ON "daily_category_statistics"("aggregation_date", "department_id", "dimension", "value");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_requests" ADD CONSTRAINT "ai_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_requests" ADD CONSTRAINT "ai_requests_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_requests" ADD CONSTRAINT "ai_requests_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_requests" ADD CONSTRAINT "ai_requests_request_message_id_fkey" FOREIGN KEY ("request_message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_requests" ADD CONSTRAINT "ai_requests_response_message_id_fkey" FOREIGN KEY ("response_message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_classifications" ADD CONSTRAINT "request_classifications_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "ai_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_statistics" ADD CONSTRAINT "daily_statistics_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_category_statistics" ADD CONSTRAINT "daily_category_statistics_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
