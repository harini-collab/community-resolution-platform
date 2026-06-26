-- Run on existing databases: psql "$DATABASE_URL" -f database/migrations/001_community_resolution.sql

DO $$ BEGIN
  ALTER TYPE issue_status ADD VALUE IF NOT EXISTS 'Accepted' AFTER 'Assigned';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE issues
  ADD COLUMN IF NOT EXISTS area VARCHAR(120),
  ADD COLUMN IF NOT EXISTS ward VARCHAR(80),
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(6),
  ADD COLUMN IF NOT EXISTS landmark VARCHAR(180),
  ADD COLUMN IF NOT EXISTS citizen_verified BOOLEAN,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS emergency_category VARCHAR(80),
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

ALTER TABLE issues ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE issues ALTER COLUMN longitude DROP NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ward VARCHAR(80),
  ADD COLUMN IF NOT EXISTS pincode_coverage TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS area_coverage TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'Available',
  ADD COLUMN IF NOT EXISTS response_rate NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resolved_cases INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS issue_tagged_officers (
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  officer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tagged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (issue_id, officer_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  type VARCHAR(60) NOT NULL,
  title VARCHAR(180) NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issues_pincode ON issues(pincode);
CREATE INDEX IF NOT EXISTS idx_issues_ward ON issues(ward);
CREATE INDEX IF NOT EXISTS idx_users_ward ON users(ward);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_tagged_officers ON issue_tagged_officers(officer_id);
