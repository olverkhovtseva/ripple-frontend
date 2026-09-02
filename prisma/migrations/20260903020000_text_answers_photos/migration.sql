CREATE TABLE "text_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participant_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "text_answers_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "text_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "project_questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "text_answers_participant_id_question_id_key" ON "text_answers"("participant_id", "question_id");

CREATE TABLE "participant_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participant_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "caption" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "participant_photos_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "participants_project_id_user_id_key" ON "participants"("project_id", "user_id");
