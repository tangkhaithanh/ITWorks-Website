ALTER TABLE "Cv"
ADD COLUMN "ai_service_id" INTEGER;

CREATE UNIQUE INDEX "Cv_ai_service_id_key" ON "Cv"("ai_service_id");
