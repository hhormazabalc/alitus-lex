-- ClaveÚnica → Sync PJUD integration tables
CREATE TABLE IF NOT EXISTS legal_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_user_id TEXT,
    encrypted_credentials TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    last_synced_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS legal_connections_provider_user_idx
    ON legal_connections (provider, provider_user_id);

DROP TRIGGER IF EXISTS update_legal_connections_updated_at ON legal_connections;

CREATE TRIGGER update_legal_connections_updated_at
    BEFORE UPDATE ON legal_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE legal_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select their legal connections" ON legal_connections;
CREATE POLICY "Users select their legal connections"
    ON legal_connections
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their legal connections" ON legal_connections;
CREATE POLICY "Users insert their legal connections"
    ON legal_connections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their legal connections" ON legal_connections;
CREATE POLICY "Users update their legal connections"
    ON legal_connections
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete their legal connections" ON legal_connections;
CREATE POLICY "Users delete their legal connections"
    ON legal_connections
    FOR DELETE
    USING (auth.uid() = user_id);

-- Jobs orchestrating pulls from PJUD
CREATE TABLE IF NOT EXISTS legal_sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES legal_connections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'error')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS legal_sync_jobs_user_idx
    ON legal_sync_jobs (user_id);

CREATE INDEX IF NOT EXISTS legal_sync_jobs_connection_idx
    ON legal_sync_jobs (connection_id);

DROP TRIGGER IF EXISTS update_legal_sync_jobs_updated_at ON legal_sync_jobs;

CREATE TRIGGER update_legal_sync_jobs_updated_at
    BEFORE UPDATE ON legal_sync_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE legal_sync_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select their sync jobs" ON legal_sync_jobs;
CREATE POLICY "Users select their sync jobs"
    ON legal_sync_jobs
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their sync jobs" ON legal_sync_jobs;
CREATE POLICY "Users insert their sync jobs"
    ON legal_sync_jobs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their sync jobs" ON legal_sync_jobs;
CREATE POLICY "Users update their sync jobs"
    ON legal_sync_jobs
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete their sync jobs" ON legal_sync_jobs;
CREATE POLICY "Users delete their sync jobs"
    ON legal_sync_jobs
    FOR DELETE
    USING (auth.uid() = user_id);

-- Cases synchronized from PJUD
CREATE TABLE IF NOT EXISTS legal_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES legal_connections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    external_id TEXT NOT NULL,
    case_number TEXT,
    title TEXT,
    status TEXT,
    court_name TEXT,
    jurisdiction TEXT,
    filed_at DATE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (connection_id, external_id)
);

CREATE INDEX IF NOT EXISTS legal_cases_user_idx
    ON legal_cases (user_id);

CREATE INDEX IF NOT EXISTS legal_cases_connection_idx
    ON legal_cases (connection_id);

DROP TRIGGER IF EXISTS update_legal_cases_updated_at ON legal_cases;

CREATE TRIGGER update_legal_cases_updated_at
    BEFORE UPDATE ON legal_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select their synced cases" ON legal_cases;
CREATE POLICY "Users select their synced cases"
    ON legal_cases
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their synced cases" ON legal_cases;
CREATE POLICY "Users insert their synced cases"
    ON legal_cases
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their synced cases" ON legal_cases;
CREATE POLICY "Users update their synced cases"
    ON legal_cases
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete their synced cases" ON legal_cases;
CREATE POLICY "Users delete their synced cases"
    ON legal_cases
    FOR DELETE
    USING (auth.uid() = user_id);

-- Timeline of PJUD events for synced cases
CREATE TABLE IF NOT EXISTS legal_case_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
    connection_id UUID NOT NULL REFERENCES legal_connections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    summary TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS legal_case_events_case_idx
    ON legal_case_events (case_id);

CREATE INDEX IF NOT EXISTS legal_case_events_user_idx
    ON legal_case_events (user_id);

ALTER TABLE legal_case_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select their case events" ON legal_case_events;
CREATE POLICY "Users select their case events"
    ON legal_case_events
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their case events" ON legal_case_events;
CREATE POLICY "Users insert their case events"
    ON legal_case_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their case events" ON legal_case_events;
CREATE POLICY "Users update their case events"
    ON legal_case_events
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete their case events" ON legal_case_events;
CREATE POLICY "Users delete their case events"
    ON legal_case_events
    FOR DELETE
    USING (auth.uid() = user_id);
