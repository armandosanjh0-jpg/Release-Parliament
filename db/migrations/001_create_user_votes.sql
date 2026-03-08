-- PostgreSQL migration for production persistence
CREATE TABLE IF NOT EXISTS user_votes (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  bill_id TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('Yea', 'Nay', 'Abstain')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_votes_bill_id ON user_votes (bill_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_user_id ON user_votes (user_id);
