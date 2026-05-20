-- CreateEnum
CREATE TYPE "public"."AttachmentType" AS ENUM ('image', 'file');

-- AlterEnum
ALTER TYPE "public"."NotificationType" ADD VALUE 'message';

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" BIGSERIAL NOT NULL,
    "job_id" BIGINT NOT NULL,
    "applicant_account_id" BIGINT NOT NULL,
    "recruiter_account_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" BIGSERIAL NOT NULL,
    "conversation_id" BIGINT NOT NULL,
    "sender_account_id" BIGINT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MessageAttachment" (
    "id" BIGSERIAL NOT NULL,
    "message_id" BIGINT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_public_id" TEXT NOT NULL,
    "type" "public"."AttachmentType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_applicant_account_id_idx" ON "public"."Conversation"("applicant_account_id");

-- CreateIndex
CREATE INDEX "Conversation_recruiter_account_id_idx" ON "public"."Conversation"("recruiter_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_job_id_applicant_account_id_key" ON "public"."Conversation"("job_id", "applicant_account_id");

-- CreateIndex
CREATE INDEX "Message_conversation_id_created_at_idx" ON "public"."Message"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "MessageAttachment_message_id_idx" ON "public"."MessageAttachment"("message_id");

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_applicant_account_id_fkey" FOREIGN KEY ("applicant_account_id") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_recruiter_account_id_fkey" FOREIGN KEY ("recruiter_account_id") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_sender_account_id_fkey" FOREIGN KEY ("sender_account_id") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
