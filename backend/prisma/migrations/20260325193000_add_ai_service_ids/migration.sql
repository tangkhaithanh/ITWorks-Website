ALTER TABLE "Candidate"
ADD COLUMN "ai_service_id" INTEGER;

ALTER TABLE "Company"
ADD COLUMN "ai_service_id" INTEGER;

ALTER TABLE "Job"
ADD COLUMN "ai_service_id" INTEGER;

CREATE UNIQUE INDEX "Candidate_ai_service_id_key" ON "Candidate"("ai_service_id");

CREATE UNIQUE INDEX "Company_ai_service_id_key" ON "Company"("ai_service_id");

CREATE UNIQUE INDEX "Job_ai_service_id_key" ON "Job"("ai_service_id");
