-- CreateTable
CREATE TABLE "organizer_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "magic_link_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "project_title" TEXT,
    "role" TEXT NOT NULL DEFAULT 'organizer',
    "terms_accepted_at" DATETIME NOT NULL,
    "draft_json" TEXT,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organizer_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "organizer_registrations_magic_link_id_fkey" FOREIGN KEY ("magic_link_id") REFERENCES "magic_links" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "organizer_registrations_magic_link_id_key" ON "organizer_registrations"("magic_link_id");

-- CreateIndex
CREATE INDEX "organizer_registrations_user_id_idx" ON "organizer_registrations"("user_id");
