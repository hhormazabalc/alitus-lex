BEGIN;

/* -------------------------------------------------------------------------- */
/* 1. Enumerations                                                            */
/* -------------------------------------------------------------------------- */

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_status') THEN
    CREATE TYPE profile_status AS ENUM ('pending', 'active', 'blocked');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_role') THEN
    CREATE TYPE membership_role AS ENUM ('owner', 'admin', 'lawyer', 'analyst', 'client_guest');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') THEN
    CREATE TYPE membership_status AS ENUM ('active', 'invited', 'suspended');
  END IF;
END $$;

/* -------------------------------------------------------------------------- */
/* 2. New core tables                                                         */
/* -------------------------------------------------------------------------- */

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role membership_role NOT NULL DEFAULT 'lawyer',
  status membership_status NOT NULL DEFAULT 'invited',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, org_id)
);

CREATE TABLE IF NOT EXISTS domains (
  host TEXT PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* -------------------------------------------------------------------------- */
/* 3. Drop legacy policies & helper functions                                 */
/* -------------------------------------------------------------------------- */

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Cases policies
DROP POLICY IF EXISTS "Admins can view all cases" ON cases;
DROP POLICY IF EXISTS "Abogados y analistas pueden ver casos asignados" ON cases;
DROP POLICY IF EXISTS "Clientes can view their cases" ON cases;
DROP POLICY IF EXISTS "Admins and abogados can insert cases" ON cases;
DROP POLICY IF EXISTS "Admins can update all cases" ON cases;
DROP POLICY IF EXISTS "Abogados can update their assigned cases" ON cases;
DROP POLICY IF EXISTS "Abogados can view their assigned cases" ON cases;

-- Case stages policies
DROP POLICY IF EXISTS "Users can view stages of accessible cases" ON case_stages;
DROP POLICY IF EXISTS "Clientes can only view public stages" ON case_stages;
DROP POLICY IF EXISTS "Admins and abogados can insert stages" ON case_stages;
DROP POLICY IF EXISTS "Admins and abogados can update stages" ON case_stages;

-- Notes policies
DROP POLICY IF EXISTS "Users can view notes of accessible cases" ON notes;
DROP POLICY IF EXISTS "Clientes can only view public notes" ON notes;
DROP POLICY IF EXISTS "Admins and abogados can insert notes" ON notes;
DROP POLICY IF EXISTS "Authors can update their own notes" ON notes;

-- Documents policies
DROP POLICY IF EXISTS "Users can view documents of accessible cases" ON documents;
DROP POLICY IF EXISTS "Clientes can only view client-visible documents" ON documents;
DROP POLICY IF EXISTS "Users can insert documents to accessible cases" ON documents;
DROP POLICY IF EXISTS "Uploaders can update their own documents" ON documents;
DROP POLICY IF EXISTS "Admins and abogados can update all documents" ON documents;

-- Info requests policies
DROP POLICY IF EXISTS "Users can view requests of accessible cases" ON info_requests;
DROP POLICY IF EXISTS "Admins and abogados can insert requests" ON info_requests;
DROP POLICY IF EXISTS "Creators can update their own requests" ON info_requests;
DROP POLICY IF EXISTS "Clientes can update requests for their cases" ON info_requests;

-- Case clients policies
DROP POLICY IF EXISTS "Admins can view all case-client mappings" ON case_clients;
DROP POLICY IF EXISTS "Abogados can view mappings for their cases" ON case_clients;
DROP POLICY IF EXISTS "Clientes can view their own mappings" ON case_clients;
DROP POLICY IF EXISTS "Admins and abogados can insert case-client mappings" ON case_clients;
DROP POLICY IF EXISTS "Firmas pueden ver mappings" ON case_clients;
DROP POLICY IF EXISTS "Firmas pueden vincular clientes" ON case_clients;

-- Case collaborators policies
DROP POLICY IF EXISTS "Users can view collaborators of accessible cases" ON case_collaborators;
DROP POLICY IF EXISTS "Admins can insert collaborators" ON case_collaborators;
DROP POLICY IF EXISTS "Admins can update collaborators" ON case_collaborators;

-- Case messages policies
DROP POLICY IF EXISTS "Participants read case messages" ON case_messages;
DROP POLICY IF EXISTS "Abogados y admin envían mensajes" ON case_messages;
DROP POLICY IF EXISTS "Clientes responden sus casos" ON case_messages;
DROP POLICY IF EXISTS "Solo autor modifica o elimina" ON case_messages;
DROP POLICY IF EXISTS "Solo autor elimina" ON case_messages;

-- Case counterparties policies
DROP POLICY IF EXISTS "Usuarios pueden ver contrapartes de casos accesibles" ON case_counterparties;
DROP POLICY IF EXISTS "Staff puede insertar contrapartes" ON case_counterparties;
DROP POLICY IF EXISTS "Staff puede actualizar contrapartes" ON case_counterparties;
DROP POLICY IF EXISTS "Staff puede eliminar contrapartes" ON case_counterparties;

-- Quick links / legal templates
DROP POLICY IF EXISTS "Abogados y admin ven enlaces" ON quick_links;
DROP POLICY IF EXISTS "Abogados y admin crean enlaces" ON quick_links;
DROP POLICY IF EXISTS "Autor o admin gestiona" ON quick_links;
DROP POLICY IF EXISTS "Autor o admin elimina" ON quick_links;

DROP POLICY IF EXISTS "Templates visibles por abogados y admin" ON legal_templates;
DROP POLICY IF EXISTS "Solo admin crea plantillas compartidas" ON legal_templates;
DROP POLICY IF EXISTS "Autor o admin actualiza" ON legal_templates;
DROP POLICY IF EXISTS "Autor o admin elimina" ON legal_templates;

-- Audit log
DROP POLICY IF EXISTS "Only admins can view audit logs" ON audit_log;
DROP POLICY IF EXISTS "All authenticated users can insert audit logs" ON audit_log;

-- Portal tokens
DROP POLICY IF EXISTS "Only admins and abogados can view portal tokens" ON portal_tokens;
DROP POLICY IF EXISTS "Only admins and abogados can insert portal tokens" ON portal_tokens;
DROP POLICY IF EXISTS "Only admins and abogados can update portal tokens" ON portal_tokens;

-- Legacy helper functions (policies dropped above)
DROP FUNCTION IF EXISTS get_current_profile();
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_abogado();
DROP FUNCTION IF EXISTS is_cliente();
DROP FUNCTION IF EXISTS has_case_access(UUID);

/* -------------------------------------------------------------------------- */
/* 4. Profiles adjustments                                                    */
/* -------------------------------------------------------------------------- */

ALTER TABLE profiles
  RENAME COLUMN nombre TO full_name;

ALTER TABLE profiles
  RENAME COLUMN telefono TO phone;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS status profile_status NOT NULL DEFAULT 'pending';

UPDATE profiles
SET full_name = COALESCE(full_name, email);

ALTER TABLE profiles
  ALTER COLUMN full_name SET NOT NULL;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS new_id UUID;

UPDATE profiles
SET new_id = user_id;

/* Drop foreign keys referencing old profile IDs */
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_abogado_responsable_fkey;
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_analista_id_fkey;
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_cliente_principal_id_fkey;
ALTER TABLE case_stages DROP CONSTRAINT IF EXISTS case_stages_responsable_id_fkey;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_author_id_fkey;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_uploader_id_fkey;
ALTER TABLE info_requests DROP CONSTRAINT IF EXISTS info_requests_creador_id_fkey;
ALTER TABLE info_requests DROP CONSTRAINT IF EXISTS info_requests_respondido_por_fkey;
ALTER TABLE case_clients DROP CONSTRAINT IF EXISTS case_clients_client_profile_id_fkey;
ALTER TABLE case_collaborators DROP CONSTRAINT IF EXISTS case_collaborators_abogado_id_fkey;
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_actor_id_fkey;
ALTER TABLE portal_tokens DROP CONSTRAINT IF EXISTS portal_tokens_client_profile_id_fkey;
ALTER TABLE magic_links DROP CONSTRAINT IF EXISTS magic_links_client_profile_id_fkey;
ALTER TABLE magic_links DROP CONSTRAINT IF EXISTS magic_links_created_by_fkey;
ALTER TABLE quick_links DROP CONSTRAINT IF EXISTS quick_links_created_by_fkey;
ALTER TABLE legal_templates DROP CONSTRAINT IF EXISTS legal_templates_created_by_fkey;
ALTER TABLE security_settings DROP CONSTRAINT IF EXISTS security_settings_updated_by_fkey;
ALTER TABLE case_messages DROP CONSTRAINT IF EXISTS case_messages_sender_profile_id_fkey;
ALTER TABLE legal_connections DROP CONSTRAINT IF EXISTS legal_connections_user_id_fkey;
ALTER TABLE legal_sync_jobs DROP CONSTRAINT IF EXISTS legal_sync_jobs_user_id_fkey;
ALTER TABLE legal_cases DROP CONSTRAINT IF EXISTS legal_cases_user_id_fkey;
ALTER TABLE legal_case_events DROP CONSTRAINT IF EXISTS legal_case_events_user_id_fkey;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;
ALTER TABLE login_attempts DROP CONSTRAINT IF EXISTS login_attempts_user_id_fkey;
ALTER TABLE case_stages DROP CONSTRAINT IF EXISTS case_stages_solicitado_por_fkey;
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_user_id_fkey;
ALTER TABLE audit_events DROP CONSTRAINT IF EXISTS audit_events_actor_id_fkey;

/* Update references to new auth-aligned IDs */
UPDATE cases SET abogado_responsable = profiles.new_id
FROM profiles
WHERE cases.abogado_responsable = profiles.id;

UPDATE cases SET analista_id = profiles.new_id
FROM profiles
WHERE cases.analista_id = profiles.id;

UPDATE cases SET cliente_principal_id = profiles.new_id
FROM profiles
WHERE cases.cliente_principal_id = profiles.id;

UPDATE case_stages SET responsable_id = profiles.new_id
FROM profiles
WHERE case_stages.responsable_id = profiles.id;

UPDATE notes SET author_id = profiles.new_id
FROM profiles
WHERE notes.author_id = profiles.id;

UPDATE documents SET uploader_id = profiles.new_id
FROM profiles
WHERE documents.uploader_id = profiles.id;

UPDATE info_requests SET creador_id = profiles.new_id
FROM profiles
WHERE info_requests.creador_id = profiles.id;

UPDATE info_requests SET respondido_por = profiles.new_id
FROM profiles
WHERE info_requests.respondido_por = profiles.id;

UPDATE case_clients SET client_profile_id = profiles.new_id
FROM profiles
WHERE case_clients.client_profile_id = profiles.id;

UPDATE case_collaborators SET abogado_id = profiles.new_id
FROM profiles
WHERE case_collaborators.abogado_id = profiles.id;

UPDATE audit_log SET actor_id = profiles.new_id
FROM profiles
WHERE audit_log.actor_id = profiles.id;

UPDATE portal_tokens SET client_profile_id = profiles.new_id
FROM profiles
WHERE portal_tokens.client_profile_id = profiles.id;

UPDATE magic_links SET client_profile_id = profiles.new_id
FROM profiles
WHERE magic_links.client_profile_id = profiles.id;

UPDATE magic_links SET created_by = profiles.new_id
FROM profiles
WHERE magic_links.created_by = profiles.id;

UPDATE quick_links SET created_by = profiles.new_id
FROM profiles
WHERE quick_links.created_by = profiles.id;

UPDATE legal_templates SET created_by = profiles.new_id
FROM profiles
WHERE legal_templates.created_by = profiles.id;

UPDATE security_settings SET updated_by = profiles.new_id
FROM profiles
WHERE security_settings.updated_by = profiles.id;

UPDATE case_messages SET sender_profile_id = profiles.new_id
FROM profiles
WHERE case_messages.sender_profile_id = profiles.id;

UPDATE legal_connections SET user_id = profiles.new_id
FROM profiles
WHERE legal_connections.user_id = profiles.id;

UPDATE legal_sync_jobs SET user_id = profiles.new_id
FROM profiles
WHERE legal_sync_jobs.user_id = profiles.id;

UPDATE legal_cases SET user_id = profiles.new_id
FROM profiles
WHERE legal_cases.user_id = profiles.id;

UPDATE legal_case_events SET user_id = profiles.new_id
FROM profiles
WHERE legal_case_events.user_id = profiles.id;

/* Align primary key with auth.users.id */
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;

ALTER TABLE profiles
  ALTER COLUMN id DROP DEFAULT;

UPDATE profiles
SET id = new_id;

ALTER TABLE profiles
  ALTER COLUMN id SET NOT NULL;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE profiles
  ADD CONSTRAINT profiles_auth_fk FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE profiles
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE profiles
  DROP COLUMN IF EXISTS new_id;

/* -------------------------------------------------------------------------- */
/* 5. Organizations linkage on business entities                              */
/* -------------------------------------------------------------------------- */

ALTER TABLE cases ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE case_stages ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE info_requests ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE case_messages ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE case_clients ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE case_collaborators ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE quick_links ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE legal_templates ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE case_counterparties ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE portal_tokens ADD COLUMN IF NOT EXISTS org_id UUID;

/* Default organization bootstrap */
INSERT INTO organizations (id, name, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Firm', 'standard')
ON CONFLICT (id) DO NOTHING;

UPDATE profiles
SET status = CASE
  WHEN activo IS FALSE THEN 'pending'::profile_status
  ELSE 'active'::profile_status
END;

/* Map existing users to default org */
INSERT INTO memberships (user_id, org_id, role, status)
SELECT
  p.id,
  '00000000-0000-0000-0000-000000000001'::UUID,
  CASE
    WHEN ROW_NUMBER() OVER (ORDER BY p.created_at NULLS FIRST, p.email) = 1 THEN 'owner'::membership_role
    ELSE 'lawyer'::membership_role
  END,
  CASE
    WHEN COALESCE(p.activo, TRUE) THEN 'active'::membership_status
    ELSE 'invited'::membership_status
  END
FROM profiles p
ON CONFLICT (user_id, org_id) DO NOTHING;

/* Propagate org_id to existing data */
UPDATE cases
SET org_id = '00000000-0000-0000-0000-000000000001'
WHERE org_id IS NULL;

UPDATE case_stages
SET org_id = cases.org_id
FROM cases
WHERE case_stages.case_id = cases.id;

UPDATE notes
SET org_id = cases.org_id
FROM cases
WHERE notes.case_id = cases.id;

UPDATE documents
SET org_id = cases.org_id
FROM cases
WHERE documents.case_id = cases.id;

UPDATE info_requests
SET org_id = cases.org_id
FROM cases
WHERE info_requests.case_id = cases.id;

UPDATE case_messages
SET org_id = cases.org_id
FROM cases
WHERE case_messages.case_id = cases.id;

UPDATE case_clients
SET org_id = cases.org_id
FROM cases
WHERE case_clients.case_id = cases.id;

UPDATE case_collaborators
SET org_id = cases.org_id
FROM cases
WHERE case_collaborators.case_id = cases.id;

UPDATE case_counterparties
SET org_id = cases.org_id
FROM cases
WHERE case_counterparties.case_id = cases.id;

UPDATE quick_links
SET org_id = '00000000-0000-0000-0000-000000000001'
WHERE org_id IS NULL;

UPDATE legal_templates
SET org_id = '00000000-0000-0000-0000-000000000001'
WHERE org_id IS NULL;

UPDATE audit_log
SET org_id = cases.org_id
FROM cases
WHERE audit_log.entity_id = cases.id
  AND audit_log.org_id IS NULL;

UPDATE portal_tokens
SET org_id = cases.org_id
FROM cases
WHERE portal_tokens.case_id = cases.id;

/* Enforce NOT NULL & add FKs */
ALTER TABLE cases ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE case_stages ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE notes ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE documents ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE info_requests ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE case_messages ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE case_clients ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE case_collaborators ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE quick_links ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE legal_templates ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE audit_log ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE case_counterparties ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE portal_tokens ALTER COLUMN org_id SET NOT NULL;

ALTER TABLE cases ADD CONSTRAINT cases_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE case_stages ADD CONSTRAINT case_stages_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE notes ADD CONSTRAINT notes_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE documents ADD CONSTRAINT documents_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE info_requests ADD CONSTRAINT info_requests_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE case_messages ADD CONSTRAINT case_messages_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE case_clients ADD CONSTRAINT case_clients_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE case_collaborators ADD CONSTRAINT case_collaborators_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE quick_links ADD CONSTRAINT quick_links_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE legal_templates ADD CONSTRAINT legal_templates_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE case_counterparties ADD CONSTRAINT case_counterparties_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE portal_tokens ADD CONSTRAINT portal_tokens_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

/* Reinstate profile foreign keys */
ALTER TABLE cases
  ADD CONSTRAINT cases_abogado_responsable_fkey FOREIGN KEY (abogado_responsable) REFERENCES profiles(id);

ALTER TABLE cases
  ADD CONSTRAINT cases_analista_id_fkey FOREIGN KEY (analista_id) REFERENCES profiles(id);

ALTER TABLE cases
  ADD CONSTRAINT cases_cliente_principal_id_fkey FOREIGN KEY (cliente_principal_id) REFERENCES profiles(id);

ALTER TABLE case_stages
  ADD CONSTRAINT case_stages_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES profiles(id);

ALTER TABLE notes
  ADD CONSTRAINT notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE documents
  ADD CONSTRAINT documents_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES profiles(id);

ALTER TABLE info_requests
  ADD CONSTRAINT info_requests_creador_id_fkey FOREIGN KEY (creador_id) REFERENCES profiles(id);

ALTER TABLE info_requests
  ADD CONSTRAINT info_requests_respondido_por_fkey FOREIGN KEY (respondido_por) REFERENCES profiles(id);

ALTER TABLE case_clients
  ADD CONSTRAINT case_clients_client_profile_id_fkey FOREIGN KEY (client_profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE case_collaborators
  ADD CONSTRAINT case_collaborators_abogado_id_fkey FOREIGN KEY (abogado_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE audit_log
  ADD CONSTRAINT audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES profiles(id);

ALTER TABLE portal_tokens
  ADD CONSTRAINT portal_tokens_client_profile_id_fkey FOREIGN KEY (client_profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE magic_links
  ADD CONSTRAINT magic_links_client_profile_id_fkey FOREIGN KEY (client_profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE magic_links
  ADD CONSTRAINT magic_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE quick_links
  ADD CONSTRAINT quick_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id);

ALTER TABLE legal_templates
  ADD CONSTRAINT legal_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id);

ALTER TABLE security_settings
  ADD CONSTRAINT security_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES profiles(id);

ALTER TABLE case_messages
  ADD CONSTRAINT case_messages_sender_profile_id_fkey FOREIGN KEY (sender_profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE legal_connections
  ADD CONSTRAINT legal_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE legal_sync_jobs
  ADD CONSTRAINT legal_sync_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE legal_cases
  ADD CONSTRAINT legal_cases_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE legal_case_events
  ADD CONSTRAINT legal_case_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE memberships
  ADD CONSTRAINT memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

/* -------------------------------------------------------------------------- */
/* 6. Tenant-aware helper functions                                           */
/* -------------------------------------------------------------------------- */

CREATE OR REPLACE FUNCTION get_current_profile()
RETURNS profiles AS $$
BEGIN
  RETURN (
    SELECT p
    FROM profiles p
    WHERE p.id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION current_membership(org_uuid UUID)
RETURNS memberships AS $$
BEGIN
  RETURN (
    SELECT m
    FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.org_id = org_uuid
      AND m.status = 'active'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_org_role(org_uuid UUID, allowed membership_role[])
RETURNS BOOLEAN AS $$
DECLARE
  m memberships;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO m
  FROM memberships
  WHERE user_id = auth.uid()
    AND org_id = org_uuid
    AND status = 'active'
  LIMIT 1;

  IF m.id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF allowed IS NULL OR array_length(allowed, 1) IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN m.role = ANY(allowed);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_org_member(org_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_org_role(org_uuid, ARRAY[]::membership_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_case_access(case_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  case_record RECORD;
BEGIN
  SELECT id, org_id INTO case_record
  FROM cases
  WHERE id = case_uuid;

  IF case_record.id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF NOT is_org_member(case_record.org_id) THEN
    RETURN FALSE;
  END IF;

  IF has_org_role(case_record.org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]) THEN
    RETURN TRUE;
  END IF;

  -- client_guest limited to assigned cases
  RETURN EXISTS (
    SELECT 1
    FROM case_clients cc
    WHERE cc.case_id = case_uuid
      AND cc.client_profile_id = auth.uid()
      AND cc.org_id = case_record.org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

/* -------------------------------------------------------------------------- */
/* 7. RLS enablement & policies                                               */
/* -------------------------------------------------------------------------- */

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_tokens ENABLE ROW LEVEL SECURITY;

/* Organizations */
CREATE POLICY organizations_member_select ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM memberships m
      WHERE m.org_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

CREATE POLICY organizations_insert ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

/* Memberships */
CREATE POLICY memberships_member_select ON memberships
  FOR SELECT USING (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst','client_guest']::membership_role[]));

CREATE POLICY memberships_admin_manage ON memberships
  FOR ALL USING (has_org_role(org_id, ARRAY['owner','admin']::membership_role[]))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin']::membership_role[]));

/* Profiles */
CREATE POLICY profiles_self_select ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY profiles_admin_select ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM memberships m
      WHERE m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner','admin')
    )
  );

CREATE POLICY profiles_admin_update ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM memberships m
      WHERE m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner','admin')
    )
  );

/* Cases */
CREATE POLICY cases_select_policy ON cases
  FOR SELECT USING (has_case_access(id));

CREATE POLICY cases_insert_policy ON cases
  FOR INSERT WITH CHECK (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]));

CREATE POLICY cases_update_policy ON cases
  FOR UPDATE USING (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]));

CREATE POLICY cases_delete_policy ON cases
  FOR DELETE USING (has_org_role(org_id, ARRAY['owner','admin']::membership_role[]));

/* Case stages */
CREATE POLICY case_stages_select_policy ON case_stages
  FOR SELECT USING (has_case_access(case_id));

CREATE POLICY case_stages_modify_policy ON case_stages
  FOR ALL USING (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]));

/* Notes */
CREATE POLICY notes_select_policy ON notes
  FOR SELECT USING (has_case_access(case_id));

CREATE POLICY notes_modify_policy ON notes
  FOR ALL USING (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]));

/* Documents */
CREATE POLICY documents_select_policy ON documents
  FOR SELECT USING (has_case_access(case_id));

CREATE POLICY documents_modify_policy ON documents
  FOR ALL USING (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]));

/* Info requests */
CREATE POLICY info_requests_select_policy ON info_requests
  FOR SELECT USING (has_case_access(case_id));

CREATE POLICY info_requests_modify_policy ON info_requests
  FOR ALL USING (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]));

/* Case messages */
CREATE POLICY case_messages_select_policy ON case_messages
  FOR SELECT USING (has_case_access(case_id));

CREATE POLICY case_messages_insert_policy ON case_messages
  FOR INSERT WITH CHECK (
    has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]) OR
    (
      has_org_role(org_id, ARRAY['client_guest']::membership_role[]) AND
      EXISTS (
        SELECT 1
        FROM case_clients cc
        WHERE cc.case_id = case_messages.case_id
          AND cc.client_profile_id = auth.uid()
          AND cc.org_id = org_id
      )
    )
  );

CREATE POLICY case_messages_update_policy ON case_messages
  FOR UPDATE USING (
    has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]) OR
    sender_profile_id = auth.uid()
  );

CREATE POLICY case_messages_delete_policy ON case_messages
  FOR DELETE USING (
    has_org_role(org_id, ARRAY['owner','admin']::membership_role[]) OR
    sender_profile_id = auth.uid()
  );

/* Case clients */
CREATE POLICY case_clients_staff_select ON case_clients
  FOR SELECT USING (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]));

CREATE POLICY case_clients_client_select ON case_clients
  FOR SELECT USING (client_profile_id = auth.uid());

CREATE POLICY case_clients_modify_policy ON case_clients
  FOR ALL USING (has_org_role(org_id, ARRAY['owner','admin','lawyer']::membership_role[]))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin','lawyer']::membership_role[]));

/* Case collaborators */
CREATE POLICY case_collaborators_select_policy ON case_collaborators
  FOR SELECT USING (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]));

CREATE POLICY case_collaborators_modify_policy ON case_collaborators
  FOR ALL USING (has_org_role(org_id, ARRAY['owner','admin']::membership_role[]))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin']::membership_role[]));

/* Case counterparties */
CREATE POLICY case_counterparties_select_policy ON case_counterparties
  FOR SELECT USING (has_case_access(case_id));

CREATE POLICY case_counterparties_modify_policy ON case_counterparties
  FOR ALL USING (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]));

/* Quick links */
CREATE POLICY quick_links_select_policy ON quick_links
  FOR SELECT USING (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]));

CREATE POLICY quick_links_modify_policy ON quick_links
  FOR ALL USING (has_org_role(org_id, ARRAY['owner','admin','lawyer']::membership_role[]))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin','lawyer']::membership_role[]));

/* Legal templates */
CREATE POLICY legal_templates_select_policy ON legal_templates
  FOR SELECT USING (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]));

CREATE POLICY legal_templates_modify_policy ON legal_templates
  FOR ALL USING (has_org_role(org_id, ARRAY['owner','admin','lawyer']::membership_role[]))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin','lawyer']::membership_role[]));

/* Portal tokens */
CREATE POLICY portal_tokens_select_policy ON portal_tokens
  FOR SELECT USING (has_case_access(case_id));

CREATE POLICY portal_tokens_modify_policy ON portal_tokens
  FOR ALL USING (has_org_role(org_id, ARRAY['owner','admin','lawyer']::membership_role[]))
  WITH CHECK (has_org_role(org_id, ARRAY['owner','admin','lawyer']::membership_role[]));

/* Audit log / events */
CREATE POLICY audit_log_select_policy ON audit_log
  FOR SELECT USING (has_org_role(org_id, ARRAY['owner','admin']::membership_role[]));

CREATE POLICY audit_log_insert_policy ON audit_log
  FOR INSERT WITH CHECK (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]));

CREATE POLICY audit_events_select_policy ON audit_events
  FOR SELECT USING (has_org_role(org_id, ARRAY['owner','admin']::membership_role[]));

CREATE POLICY audit_events_insert_policy ON audit_events
  FOR INSERT WITH CHECK (has_org_role(org_id, ARRAY['owner','admin','lawyer','analyst']::membership_role[]));

/* Domains */
CREATE POLICY domains_select_policy ON domains
  FOR SELECT USING (has_org_role(org_id, ARRAY['owner','admin']::membership_role[]));

/* Membership visibility to owners/admins for their orgs */
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

/* -------------------------------------------------------------------------- */
/* 8. Storage bucket                                                          */
/* -------------------------------------------------------------------------- */

INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', FALSE)
ON CONFLICT (id) DO NOTHING;

/* -------------------------------------------------------------------------- */
/* 9. User-owned helper tables (keep self access)                             */
/* -------------------------------------------------------------------------- */

CREATE POLICY legal_connections_rw ON legal_connections
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY legal_sync_jobs_rw ON legal_sync_jobs
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY legal_cases_rw ON legal_cases
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY legal_case_events_rw ON legal_case_events
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
