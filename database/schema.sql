CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('citizen', 'officer', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE issue_status AS ENUM (
    'Reported', 'Assigned', 'Accepted', 'In Progress',
    'Resolved', 'Citizen Verified', 'Closed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'citizen',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  ward VARCHAR(80),
  pincode_coverage TEXT[] DEFAULT '{}',
  area_coverage TEXT[] DEFAULT '{}',
  availability_status VARCHAR(20) NOT NULL DEFAULT 'Available'
    CHECK (availability_status IN ('Available', 'Busy', 'On Leave')),
  response_rate NUMERIC(5, 2) DEFAULT 0,
  resolved_cases INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(120) NOT NULL,
  image_url TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  address TEXT,
  area VARCHAR(120),
  ward VARCHAR(80),
  pincode VARCHAR(6),
  landmark VARCHAR(180),
  status issue_status NOT NULL DEFAULT 'Reported',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_department UUID REFERENCES departments(id) ON DELETE SET NULL,
  assigned_officer UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  predicted_category VARCHAR(120),
  confidence_score NUMERIC(5, 2),
  suggested_department VARCHAR(120),
  priority_level VARCHAR(40) DEFAULT 'Medium',
  severity_level VARCHAR(40) DEFAULT 'Medium',
  emergency_category VARCHAR(80),
  duplicate_of UUID REFERENCES issues(id) ON DELETE SET NULL,
  before_image_url TEXT,
  after_image_url TEXT,
  resolution_photo TEXT,
  progress_photo_url TEXT,
  resolution_notes TEXT,
  resolution_timestamp TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  citizen_verified BOOLEAN,
  verified_at TIMESTAMPTZ,
  satisfaction_rating INT CHECK (satisfaction_rating BETWEEN 1 AND 5),
  votes_count INT NOT NULL DEFAULT 0,
  followers_count INT NOT NULL DEFAULT 0,
  emergency_escalated BOOLEAN NOT NULL DEFAULT FALSE,
  emergency_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_remarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  officer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  remark TEXT NOT NULL,
  proof_url TEXT,
  status issue_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name VARCHAR(120),
  status issue_status,
  event_type VARCHAR(80) NOT NULL,
  notes TEXT,
  proof_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_votes (
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (issue_id, user_id)
);

CREATE TABLE IF NOT EXISTS issue_followers (
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (issue_id, user_id)
);

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

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_ward ON users(ward);
CREATE INDEX IF NOT EXISTS idx_issues_created_by ON issues(created_by);
CREATE INDEX IF NOT EXISTS idx_issues_department ON issues(assigned_department);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_pincode ON issues(pincode);
CREATE INDEX IF NOT EXISTS idx_issues_ward ON issues(ward);
CREATE INDEX IF NOT EXISTS idx_issues_location ON issues(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_timeline_issue ON issue_timeline(issue_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_tagged_officers ON issue_tagged_officers(officer_id);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'General',
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
