BEGIN;

CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'failed')),
  billing_period DATE,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS billing_events_org_id_idx ON billing_events(org_id);
CREATE INDEX IF NOT EXISTS billing_events_paid_at_idx ON billing_events(paid_at);

ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY billing_events_owner_select
  ON billing_events
  FOR SELECT USING (has_org_role(org_id, ARRAY['owner','admin']::membership_role[]));

CREATE POLICY billing_events_owner_modify
  ON billing_events
  FOR ALL USING (has_org_role(org_id, ARRAY['owner']::membership_role[]))
  WITH CHECK (has_org_role(org_id, ARRAY['owner']::membership_role[]));

COMMIT;
