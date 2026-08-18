-- Production PostgreSQL schema (reference)
-- Local development uses Prisma + SQLite; switch provider to postgresql for this SQL.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id),
  product_type VARCHAR(20) DEFAULT 'video',
  title VARCHAR(255) NOT NULL,
  hero_name VARCHAR(255) NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  share_slug VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  invite_message TEXT,
  video_format VARCHAR(20) NOT NULL DEFAULT 'vertical',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  hint_text TEXT,
  order_index INT NOT NULL
);

CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NULL REFERENCES users(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'in_progress',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE media_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  question_id UUID REFERENCES project_questions(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_mime_type VARCHAR(50),
  duration_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (participant_id, question_id)
);
