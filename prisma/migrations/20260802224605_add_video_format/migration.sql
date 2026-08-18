-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizer_id" TEXT NOT NULL,
    "product_type" TEXT NOT NULL DEFAULT 'video',
    "title" TEXT NOT NULL,
    "hero_name" TEXT NOT NULL,
    "deadline" DATETIME NOT NULL,
    "share_slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "invite_message" TEXT,
    "video_format" TEXT NOT NULL DEFAULT 'vertical',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projects_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_projects" ("created_at", "deadline", "hero_name", "id", "invite_message", "organizer_id", "product_type", "share_slug", "status", "title") SELECT "created_at", "deadline", "hero_name", "id", "invite_message", "organizer_id", "product_type", "share_slug", "status", "title" FROM "projects";
DROP TABLE "projects";
ALTER TABLE "new_projects" RENAME TO "projects";
CREATE UNIQUE INDEX "projects_share_slug_key" ON "projects"("share_slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
