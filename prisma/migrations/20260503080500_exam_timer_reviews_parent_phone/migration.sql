-- AlterTable
ALTER TABLE "exams" ADD COLUMN "duration_minutes" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "results" ADD COLUMN "attempt_id" TEXT,
ADD COLUMN "timed_out" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "parent_phone" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "result_answers" (
    "id" TEXT NOT NULL,
    "result_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_choice_id" TEXT,
    "question_text" TEXT NOT NULL,
    "question_image_url" TEXT,
    "selected_choice_text" TEXT,
    "correct_choice_text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "result_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "submitted_at" TIMESTAMP(3),

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "result_answers_result_id_idx" ON "result_answers"("result_id");

-- CreateIndex
CREATE UNIQUE INDEX "result_answers_result_id_question_id_key" ON "result_answers"("result_id", "question_id");

-- CreateIndex
CREATE INDEX "exam_attempts_user_id_exam_id_submitted_at_idx" ON "exam_attempts"("user_id", "exam_id", "submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "results_attempt_id_key" ON "results"("attempt_id");

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "exam_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_answers" ADD CONSTRAINT "result_answers_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
