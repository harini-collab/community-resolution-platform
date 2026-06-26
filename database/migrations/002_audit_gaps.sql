-- Run on existing databases: psql "$DATABASE_URL" -f database/migrations/002_audit_gaps.sql

ALTER TABLE issues
  ADD COLUMN IF NOT EXISTS resolution_photo TEXT,
  ADD COLUMN IF NOT EXISTS progress_photo_url TEXT;

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'General',
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO emergency_contacts (name, phone, category, sort_order)
SELECT * FROM (VALUES
  ('Police', '112', 'Emergency', 1),
  ('Fire', '101', 'Emergency', 2),
  ('Ambulance', '108', 'Emergency', 3),
  ('Women Helpline', '1091', 'Support', 4)
) AS v(name, phone, category, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM emergency_contacts LIMIT 1);
