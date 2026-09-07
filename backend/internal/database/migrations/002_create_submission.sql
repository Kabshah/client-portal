
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  client_name VARCHAR NOT NULL,
  client_email VARCHAR NOT NULL,
  service_package VARCHAR NOT NULL,
  project_goal TEXT NOT NULL,
  desired_timeline VARCHAR NOT NULL,
  assets_provided VARCHAR NOT NULL,

  readiness_status VARCHAR NOT NULL
    CHECK (readiness_status IN ('ready', 'missing_info')),
  missing_items TEXT[] NOT NULL DEFAULT '{}',
  ai_summary TEXT NOT NULL,
  recommended_next_action TEXT NOT NULL,

  admin_status VARCHAR NOT NULL DEFAULT 'pending'
    CHECK (admin_status IN ('pending', 'approved', 'rejected')),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);