-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin_firma', 'abogado', 'analista', 'cliente');
CREATE TYPE case_status AS ENUM ('activo', 'suspendido', 'archivado', 'terminado');
CREATE TYPE case_priority AS ENUM ('baja', 'media', 'alta', 'urgente');
CREATE TYPE stage_status AS ENUM ('pendiente', 'en_proceso', 'completado');
CREATE TYPE note_type AS ENUM ('privada', 'publica');
CREATE TYPE document_visibility AS ENUM ('privado', 'cliente');
CREATE TYPE request_type AS ENUM ('documento', 'informacion', 'reunion', 'otro');
CREATE TYPE request_status AS ENUM ('pendiente', 'en_revision', 'respondida', 'cerrada');
CREATE TYPE case_workflow_state AS ENUM ('preparacion', 'en_revision', 'activo', 'cerrado');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'cliente',
    nombre TEXT NOT NULL,
    rut TEXT UNIQUE,
    telefono TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cases table
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_causa TEXT,
    caratulado TEXT NOT NULL,
    materia TEXT,
    tribunal TEXT,
    region TEXT,
    comuna TEXT,
    rut_cliente TEXT,
    nombre_cliente TEXT NOT NULL,
    contraparte TEXT,
    etapa_actual TEXT DEFAULT 'Ingreso Demanda',
    estado case_status DEFAULT 'activo',
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    abogado_responsable UUID REFERENCES profiles(id),
    analista_id UUID REFERENCES profiles(id),
    workflow_state case_workflow_state DEFAULT 'preparacion',
    validado_at TIMESTAMPTZ,
    prioridad case_priority DEFAULT 'media',
    valor_estimado NUMERIC(15,2),
    observaciones TEXT,
    descripcion_inicial TEXT,
    objetivo_cliente TEXT,
    documentacion_recibida TEXT,
    cliente_principal_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case stages table (timeline procesal)
CREATE TABLE case_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    etapa TEXT NOT NULL,
    descripcion TEXT,
    estado stage_status DEFAULT 'pendiente',
    fecha_programada DATE,
    fecha_cumplida DATE,
    responsable_id UUID REFERENCES profiles(id),
    es_publica BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES profiles(id) NOT NULL,
    tipo note_type NOT NULL DEFAULT 'privada',
    contenido TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    uploader_id UUID REFERENCES profiles(id) NOT NULL,
    nombre TEXT NOT NULL,
    tipo_mime TEXT,
    size_bytes BIGINT,
    url TEXT NOT NULL,
    visibilidad document_visibility DEFAULT 'privado',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Information requests table
CREATE TABLE info_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    creador_id UUID REFERENCES profiles(id) NOT NULL,
    titulo TEXT NOT NULL,
    tipo request_type DEFAULT 'informacion',
    descripcion TEXT NOT NULL,
    prioridad case_priority DEFAULT 'media',
    fecha_limite DATE,
    es_publica BOOLEAN DEFAULT true,
    estado request_status DEFAULT 'pendiente',
    respuesta TEXT,
    documento_respuesta_id UUID REFERENCES documents(id),
    archivo_adjunto TEXT,
    respondido_por UUID REFERENCES profiles(id),
    respondido_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case clients mapping (for portal access)
CREATE TABLE case_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    client_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(case_id, client_profile_id)
);

-- Case collaborators (for multi-lawyer cases)
CREATE TABLE case_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    abogado_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(case_id, abogado_id)
);

-- Audit log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    diff_json JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portal tokens table (for magic links)
CREATE TABLE portal_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    client_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Magic links table (self-service portal access)
CREATE TABLE magic_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    client_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    permissions TEXT[] DEFAULT ARRAY['view_case'],
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    single_use BOOLEAN DEFAULT TRUE,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_cases_abogado_responsable ON cases(abogado_responsable);
CREATE INDEX idx_cases_estado ON cases(estado);
CREATE INDEX idx_cases_fecha_inicio ON cases(fecha_inicio);
CREATE INDEX idx_case_stages_case_id ON case_stages(case_id);
CREATE INDEX idx_case_stages_estado ON case_stages(estado);
CREATE INDEX idx_case_stages_orden ON case_stages(case_id, orden);
CREATE INDEX idx_notes_case_id ON notes(case_id);
CREATE INDEX idx_notes_tipo ON notes(tipo);
CREATE INDEX idx_documents_case_id ON documents(case_id);
CREATE INDEX idx_documents_visibilidad ON documents(visibilidad);
CREATE INDEX idx_info_requests_case_id ON info_requests(case_id);
CREATE INDEX idx_info_requests_estado ON info_requests(estado);
CREATE INDEX idx_case_clients_case_id ON case_clients(case_id);
CREATE INDEX idx_case_clients_client_profile_id ON case_clients(client_profile_id);
CREATE INDEX idx_case_collaborators_case_id ON case_collaborators(case_id);
CREATE INDEX idx_case_collaborators_abogado_id ON case_collaborators(abogado_id);
CREATE INDEX idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_portal_tokens_token ON portal_tokens(token);
CREATE INDEX idx_portal_tokens_case_id ON portal_tokens(case_id);
CREATE INDEX idx_magic_links_case_id ON magic_links(case_id);
CREATE INDEX idx_magic_links_email ON magic_links(email);
CREATE INDEX idx_magic_links_token ON magic_links(token);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_case_stages_updated_at BEFORE UPDATE ON case_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_info_requests_updated_at BEFORE UPDATE ON info_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_magic_links_updated_at BEFORE UPDATE ON magic_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's profile
CREATE OR REPLACE FUNCTION get_current_profile()
RETURNS profiles AS $$
DECLARE
    profile_record profiles;
BEGIN
    SELECT * INTO profile_record
    FROM profiles
    WHERE user_id = auth.uid();
    
    RETURN profile_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin_firma'
        FROM profiles
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is abogado
CREATE OR REPLACE FUNCTION is_abogado()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'abogado'
        FROM profiles
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is cliente
CREATE OR REPLACE FUNCTION is_cliente()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'cliente'
        FROM profiles
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has access to case
CREATE OR REPLACE FUNCTION has_case_access(case_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_profile profiles;
BEGIN
    SELECT * INTO current_profile FROM get_current_profile();
    
    -- Admin has access to all cases
    IF current_profile.role = 'admin_firma' THEN
        RETURN TRUE;
    END IF;
    
    -- Abogado has access if they are responsible or collaborator
    IF current_profile.role = 'abogado' THEN
        RETURN EXISTS (
            SELECT 1 FROM cases 
            WHERE id = case_uuid 
            AND abogado_responsable = current_profile.id
        ) OR EXISTS (
            SELECT 1 FROM case_collaborators 
            WHERE case_id = case_uuid 
            AND abogado_id = current_profile.id
        );
    END IF;
    
    -- Cliente has access if they are assigned to the case
    IF current_profile.role = 'cliente' THEN
        RETURN EXISTS (
            SELECT 1 FROM case_clients 
            WHERE case_id = case_uuid 
            AND client_profile_id = current_profile.id
        );
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert profiles" ON profiles
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (is_admin());

-- RLS Policies for cases table
CREATE POLICY "Admins can view all cases" ON cases
    FOR SELECT USING (is_admin());

CREATE POLICY "Abogados y analistas pueden ver casos asignados" ON cases
    FOR SELECT USING (
        (
            is_abogado() AND (
                abogado_responsable = (SELECT id FROM get_current_profile()) OR
                EXISTS (
                    SELECT 1 FROM case_collaborators 
                    WHERE case_id = cases.id 
                    AND abogado_id = (SELECT id FROM get_current_profile())
                )
            )
        ) OR (
            (SELECT role FROM get_current_profile()) = 'analista' AND analista_id = (SELECT id FROM get_current_profile())
        )
    );

CREATE POLICY "Clientes can view their cases" ON cases
    FOR SELECT USING (
        is_cliente() AND EXISTS (
            SELECT 1 FROM case_clients 
            WHERE case_id = cases.id 
            AND client_profile_id = (SELECT id FROM get_current_profile())
        )
    );

CREATE POLICY "Admins and abogados can insert cases" ON cases
    FOR INSERT WITH CHECK (is_admin() OR is_abogado());

CREATE POLICY "Admins can update all cases" ON cases
    FOR UPDATE USING (is_admin());

CREATE POLICY "Abogados can update their assigned cases" ON cases
    FOR UPDATE USING (
        is_abogado() AND (
            abogado_responsable = (SELECT id FROM get_current_profile()) OR
            EXISTS (
                SELECT 1 FROM case_collaborators 
                WHERE case_id = cases.id 
                AND abogado_id = (SELECT id FROM get_current_profile())
            )
        )
    );

-- RLS Policies for case_stages table
CREATE POLICY "Users can view stages of accessible cases" ON case_stages
    FOR SELECT USING (has_case_access(case_id));

CREATE POLICY "Clientes can only view public stages" ON case_stages
    FOR SELECT USING (
        is_cliente() AND es_publica = true AND has_case_access(case_id)
    );

CREATE POLICY "Admins and abogados can insert stages" ON case_stages
    FOR INSERT WITH CHECK (
        (is_admin() OR is_abogado()) AND has_case_access(case_id)
    );

CREATE POLICY "Admins and abogados can update stages" ON case_stages
    FOR UPDATE USING (
        (is_admin() OR is_abogado()) AND has_case_access(case_id)
    );

-- RLS Policies for notes table
CREATE POLICY "Users can view notes of accessible cases" ON notes
    FOR SELECT USING (has_case_access(case_id));

CREATE POLICY "Clientes can only view public notes" ON notes
    FOR SELECT USING (
        is_cliente() AND tipo = 'publica' AND has_case_access(case_id)
    );

CREATE POLICY "Admins and abogados can insert notes" ON notes
    FOR INSERT WITH CHECK (
        (is_admin() OR is_abogado()) AND has_case_access(case_id)
    );

CREATE POLICY "Authors can update their own notes" ON notes
    FOR UPDATE USING (
        author_id = (SELECT id FROM get_current_profile()) AND has_case_access(case_id)
    );

-- RLS Policies for documents table
CREATE POLICY "Users can view documents of accessible cases" ON documents
    FOR SELECT USING (has_case_access(case_id));

CREATE POLICY "Clientes can only view client-visible documents" ON documents
    FOR SELECT USING (
        is_cliente() AND visibilidad = 'cliente' AND has_case_access(case_id)
    );

CREATE POLICY "Users can insert documents to accessible cases" ON documents
    FOR INSERT WITH CHECK (has_case_access(case_id));

CREATE POLICY "Uploaders can update their own documents" ON documents
    FOR UPDATE USING (
        uploader_id = (SELECT id FROM get_current_profile()) AND has_case_access(case_id)
    );

CREATE POLICY "Admins and abogados can update all documents" ON documents
    FOR UPDATE USING (
        (is_admin() OR is_abogado()) AND has_case_access(case_id)
    );

-- RLS Policies for info_requests table
CREATE POLICY "Users can view requests of accessible cases" ON info_requests
    FOR SELECT USING (has_case_access(case_id));

CREATE POLICY "Admins and abogados can insert requests" ON info_requests
    FOR INSERT WITH CHECK (
        (is_admin() OR is_abogado()) AND has_case_access(case_id)
    );

CREATE POLICY "Creators can update their own requests" ON info_requests
    FOR UPDATE USING (
        creador_id = (SELECT id FROM get_current_profile()) AND has_case_access(case_id)
    );

CREATE POLICY "Clientes can update requests for their cases" ON info_requests
    FOR UPDATE USING (
        is_cliente() AND has_case_access(case_id)
    );

-- RLS Policies for case_clients table
CREATE POLICY "Admins can view all case-client mappings" ON case_clients
    FOR SELECT USING (is_admin());

CREATE POLICY "Abogados can view mappings for their cases" ON case_clients
    FOR SELECT USING (
        is_abogado() AND has_case_access(case_id)
    );

CREATE POLICY "Clientes can view their own mappings" ON case_clients
    FOR SELECT USING (
        is_cliente() AND client_profile_id = (SELECT id FROM get_current_profile())
    );

CREATE POLICY "Admins and abogados can insert case-client mappings" ON case_clients
    FOR INSERT WITH CHECK (
        (is_admin() OR is_abogado()) AND has_case_access(case_id)
    );

-- RLS Policies for case_collaborators table
CREATE POLICY "Users can view collaborators of accessible cases" ON case_collaborators
    FOR SELECT USING (has_case_access(case_id));

CREATE POLICY "Admins can insert collaborators" ON case_collaborators
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update collaborators" ON case_collaborators
    FOR UPDATE USING (is_admin());

-- RLS Policies for audit_log table
CREATE POLICY "Only admins can view audit logs" ON audit_log
    FOR SELECT USING (is_admin());

CREATE POLICY "All authenticated users can insert audit logs" ON audit_log
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for portal_tokens table
CREATE POLICY "Only admins and abogados can view portal tokens" ON portal_tokens
    FOR SELECT USING (is_admin() OR is_abogado());

CREATE POLICY "Only admins and abogados can insert portal tokens" ON portal_tokens
    FOR INSERT WITH CHECK (
        (is_admin() OR is_abogado()) AND has_case_access(case_id)
    );

CREATE POLICY "Only admins and abogados can update portal tokens" ON portal_tokens
    FOR UPDATE USING (
        (is_admin() OR is_abogado()) AND has_case_access(case_id)
    );
-- Crear tabla para logs de notificaciones
CREATE TABLE notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'push')),
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  template VARCHAR(100) NOT NULL,
  data JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_notification_logs_type ON notification_logs(type);
CREATE INDEX idx_notification_logs_recipient ON notification_logs(recipient);
CREATE INDEX idx_notification_logs_template ON notification_logs(template);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at);

-- Crear índice compuesto para búsquedas de duplicados
CREATE INDEX idx_notification_logs_dedup ON notification_logs(template, recipient, (data->>'stage_id'), sent_at);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_notification_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER trigger_update_notification_logs_updated_at
  BEFORE UPDATE ON notification_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_logs_updated_at();

-- Habilitar RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Política para que solo admin y service role puedan acceder
CREATE POLICY "notification_logs_admin_access" ON notification_logs
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_firma'
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE notification_logs IS 'Registro de todas las notificaciones enviadas por el sistema';
COMMENT ON COLUMN notification_logs.type IS 'Tipo de notificación: email, sms, push';
COMMENT ON COLUMN notification_logs.recipient IS 'Destinatario de la notificación (email, teléfono, etc.)';
COMMENT ON COLUMN notification_logs.subject IS 'Asunto del mensaje (para emails)';
COMMENT ON COLUMN notification_logs.template IS 'Plantilla utilizada para generar el mensaje';
COMMENT ON COLUMN notification_logs.data IS 'Datos utilizados para generar el mensaje desde la plantilla';
COMMENT ON COLUMN notification_logs.status IS 'Estado de la notificación';
COMMENT ON COLUMN notification_logs.error_message IS 'Mensaje de error si la notificación falló';
COMMENT ON COLUMN notification_logs.sent_at IS 'Fecha y hora cuando se envió la notificación';
-- Crear tabla de auditoría avanzada
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES profiles(id),
  user_role VARCHAR(50),
  user_email VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  request_id VARCHAR(255),
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('low', 'info', 'warning', 'high', 'critical')),
  category VARCHAR(50) DEFAULT 'data_change',
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para optimizar consultas de auditoría
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_category ON audit_logs(category);

-- Índice compuesto para consultas comunes
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_date ON audit_logs(user_id, created_at);

-- Crear tabla para sesiones de usuario
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  location_country VARCHAR(2),
  location_city VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(50),
  os VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Índices para sesiones
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Crear tabla para intentos de login
CREATE TABLE login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(100),
  user_id UUID REFERENCES profiles(id),
  session_id UUID REFERENCES user_sessions(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para intentos de login
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_success ON login_attempts(success);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at);

-- Crear tabla para configuración de seguridad
CREATE TABLE security_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuraciones de seguridad por defecto
INSERT INTO security_settings (setting_key, setting_value, description) VALUES
('max_login_attempts', '5', 'Máximo número de intentos de login fallidos antes de bloquear'),
('lockout_duration_minutes', '30', 'Duración del bloqueo en minutos'),
('session_timeout_hours', '8', 'Tiempo de expiración de sesión en horas'),
('password_min_length', '8', 'Longitud mínima de contraseña'),
('password_require_special', 'true', 'Requerir caracteres especiales en contraseña'),
('magic_link_expiry_hours', '24', 'Tiempo de expiración de magic links en horas'),
('max_concurrent_sessions', '3', 'Máximo número de sesiones concurrentes por usuario'),
('audit_retention_days', '365', 'Días de retención de logs de auditoría'),
('enable_ip_whitelist', 'false', 'Habilitar lista blanca de IPs'),
('allowed_file_types', '["pdf","doc","docx","jpg","jpeg","png","txt"]', 'Tipos de archivo permitidos para upload');

-- Función para limpiar logs antiguos
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
DECLARE
  retention_days INTEGER;
BEGIN
  -- Obtener configuración de retención
  SELECT (setting_value::text)::integer INTO retention_days
  FROM security_settings 
  WHERE setting_key = 'audit_retention_days' AND is_active = true;
  
  -- Usar valor por defecto si no está configurado
  IF retention_days IS NULL THEN
    retention_days := 365;
  END IF;
  
  -- Eliminar logs antiguos
  DELETE FROM audit_logs 
  WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;
  
  -- Eliminar intentos de login antiguos (mantener solo 90 días)
  DELETE FROM login_attempts 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Eliminar sesiones expiradas
  DELETE FROM user_sessions 
  WHERE expires_at < NOW() OR ended_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Función para detectar actividad sospechosa
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TABLE(
  alert_type VARCHAR,
  description TEXT,
  user_email VARCHAR,
  ip_address INET,
  severity VARCHAR,
  event_count BIGINT,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ
) AS $$
BEGIN
  -- Múltiples intentos de login fallidos
  RETURN QUERY
  SELECT 
    'multiple_failed_logins'::VARCHAR as alert_type,
    'Múltiples intentos de login fallidos'::TEXT as description,
    la.email::VARCHAR as user_email,
    la.ip_address,
    'high'::VARCHAR as severity,
    COUNT(*) as event_count,
    MIN(la.created_at) as first_seen,
    MAX(la.created_at) as last_seen
  FROM login_attempts la
  WHERE la.success = false 
    AND la.created_at > NOW() - INTERVAL '1 hour'
  GROUP BY la.email, la.ip_address
  HAVING COUNT(*) >= 5;
  
  -- Accesos desde múltiples IPs en poco tiempo
  RETURN QUERY
  SELECT 
    'multiple_ip_access'::VARCHAR as alert_type,
    'Acceso desde múltiples IPs en poco tiempo'::TEXT as description,
    p.email::VARCHAR as user_email,
    NULL::INET as ip_address,
    'warning'::VARCHAR as severity,
    COUNT(DISTINCT us.ip_address) as event_count,
    MIN(us.created_at) as first_seen,
    MAX(us.created_at) as last_seen
  FROM user_sessions us
  JOIN profiles p ON us.user_id = p.id
  WHERE us.created_at > NOW() - INTERVAL '1 hour'
    AND us.is_active = true
  GROUP BY p.email, us.user_id
  HAVING COUNT(DISTINCT us.ip_address) >= 3;
  
  -- Acceso a datos sensibles fuera de horario
  RETURN QUERY
  SELECT 
    'after_hours_access'::VARCHAR as alert_type,
    'Acceso a datos sensibles fuera de horario laboral'::TEXT as description,
    al.user_email::VARCHAR as user_email,
    al.ip_address,
    'info'::VARCHAR as severity,
    COUNT(*) as event_count,
    MIN(al.created_at) as first_seen,
    MAX(al.created_at) as last_seen
  FROM audit_logs al
  WHERE al.table_name IN ('cases', 'documents', 'notes')
    AND al.action = 'SELECT'
    AND al.created_at > NOW() - INTERVAL '24 hours'
    AND (EXTRACT(hour FROM al.created_at) < 8 OR EXTRACT(hour FROM al.created_at) > 20)
  GROUP BY al.user_email, al.ip_address
  HAVING COUNT(*) >= 10;
END;
$$ LANGUAGE plpgsql;

-- Función para auditar cambios automáticamente
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  user_info RECORD;
  changed_fields TEXT[] := '{}';
  field_name TEXT;
BEGIN
  -- Obtener información del usuario actual
  SELECT 
    p.id, p.role, p.email,
    current_setting('request.jwt.claims', true)::json->>'session_id' as session_id,
    current_setting('request.headers', true)::json->>'x-forwarded-for' as ip,
    current_setting('request.headers', true)::json->>'user-agent' as user_agent
  INTO user_info
  FROM profiles p 
  WHERE p.id = auth.uid();
  
  -- Determinar campos cambiados para UPDATE
  IF TG_OP = 'UPDATE' THEN
    FOR field_name IN 
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = TG_TABLE_NAME 
        AND table_schema = TG_TABLE_SCHEMA
    LOOP
      IF to_jsonb(OLD) ->> field_name IS DISTINCT FROM to_jsonb(NEW) ->> field_name THEN
        changed_fields := array_append(changed_fields, field_name);
      END IF;
    END LOOP;
  END IF;
  
  -- Insertar log de auditoría
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    changed_fields,
    user_id,
    user_role,
    user_email,
    ip_address,
    user_agent,
    session_id,
    severity,
    category,
    description
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    changed_fields,
    user_info.id,
    user_info.role,
    user_info.email,
    user_info.ip::inet,
    user_info.user_agent,
    user_info.session_id,
    CASE 
      WHEN TG_TABLE_NAME IN ('cases', 'documents') THEN 'high'
      WHEN TG_TABLE_NAME IN ('profiles', 'magic_links') THEN 'warning'
      ELSE 'info'
    END,
    'data_change',
    format('%s %s en tabla %s', TG_OP, COALESCE(NEW.id::text, OLD.id::text), TG_TABLE_NAME)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de auditoría a tablas importantes
CREATE TRIGGER audit_cases_trigger
  AFTER INSERT OR UPDATE OR DELETE ON cases
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_documents_trigger
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_case_notes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON notes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_case_stages_trigger
  AFTER INSERT OR UPDATE OR DELETE ON case_stages
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_magic_links_trigger
  AFTER INSERT OR UPDATE OR DELETE ON magic_links
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Habilitar RLS en todas las tablas de auditoría
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para audit_logs
CREATE POLICY "audit_logs_admin_access" ON audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_firma'
    )
  );

CREATE POLICY "audit_logs_user_own_records" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- Políticas para user_sessions
CREATE POLICY "user_sessions_own_access" ON user_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "user_sessions_admin_access" ON user_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_firma'
    )
  );

-- Políticas para login_attempts
CREATE POLICY "login_attempts_admin_access" ON login_attempts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_firma'
    )
  );

-- Políticas para security_settings
CREATE POLICY "security_settings_admin_access" ON security_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_firma'
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE audit_logs IS 'Registro completo de auditoría para todas las operaciones del sistema';
COMMENT ON TABLE user_sessions IS 'Gestión de sesiones de usuario con información de dispositivo y ubicación';
COMMENT ON TABLE login_attempts IS 'Registro de todos los intentos de login exitosos y fallidos';
COMMENT ON TABLE security_settings IS 'Configuración de parámetros de seguridad del sistema';

COMMENT ON FUNCTION detect_suspicious_activity() IS 'Detecta patrones de actividad sospechosa en el sistema';
COMMENT ON FUNCTION cleanup_old_audit_logs() IS 'Limpia logs antiguos según la configuración de retención';
COMMENT ON FUNCTION audit_trigger_function() IS 'Función de trigger para auditoría automática de cambios';
BEGIN;

-- Enum para el estado de pago de cada etapa del caso
CREATE TYPE stage_payment_status AS ENUM ('pendiente', 'en_proceso', 'parcial', 'pagado', 'vencido');

-- Campos de control de pagos por etapa
ALTER TABLE case_stages
  ADD COLUMN requiere_pago BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN costo_uf NUMERIC(10,2),
  ADD COLUMN porcentaje_variable NUMERIC(6,3),
  ADD COLUMN estado_pago stage_payment_status NOT NULL DEFAULT 'pendiente',
  ADD COLUMN enlace_pago TEXT,
  ADD COLUMN pagado_en TIMESTAMPTZ,
  ADD COLUMN payku_payment_id TEXT,
  ADD COLUMN notas_pago TEXT,
  ADD COLUMN monto_variable_base TEXT,
  ADD COLUMN monto_pagado_uf NUMERIC(10,2) DEFAULT 0;

-- Honrarios generales del caso y modalidad de cobro
ALTER TABLE cases
  ADD COLUMN modalidad_cobro TEXT NOT NULL DEFAULT 'prepago',
  ADD COLUMN honorario_total_uf NUMERIC(10,2),
  ADD COLUMN honorario_variable_porcentaje NUMERIC(6,3),
  ADD COLUMN honorario_variable_base TEXT,
  ADD COLUMN honorario_moneda TEXT NOT NULL DEFAULT 'BOB',
  ADD COLUMN honorario_notas TEXT,
  ADD COLUMN tarifa_referencia TEXT,
  ADD COLUMN honorario_pagado_uf NUMERIC(10,2) NOT NULL DEFAULT 0;

COMMIT;
BEGIN;

ALTER TYPE stage_payment_status ADD VALUE IF NOT EXISTS 'solicitado';

ALTER TABLE case_stages
  ADD COLUMN solicitado_por UUID REFERENCES profiles(id),
  ADD COLUMN solicitado_at TIMESTAMPTZ;

ALTER TABLE cases
  ADD COLUMN alcance_cliente_solicitado SMALLINT DEFAULT 0,
  ADD COLUMN alcance_cliente_autorizado SMALLINT DEFAULT 0;

COMMIT;
BEGIN;

CREATE TABLE case_counterparties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rut TEXT,
  tipo TEXT NOT NULL DEFAULT 'demandado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_case_counterparties_case_id ON case_counterparties(case_id);

ALTER TABLE case_counterparties ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_analista()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'analista'
        FROM profiles
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Usuarios pueden ver contrapartes de casos accesibles" ON case_counterparties
    FOR SELECT USING (
        has_case_access(case_id) OR (
            is_analista() AND EXISTS (
                SELECT 1 FROM cases
                WHERE id = case_counterparties.case_id
                AND analista_id = (SELECT id FROM get_current_profile())
            )
        )
    );

CREATE POLICY "Staff puede insertar contrapartes" ON case_counterparties
    FOR INSERT WITH CHECK (
        (is_admin() OR is_abogado() OR is_analista()) AND has_case_access(case_id)
    );

CREATE POLICY "Staff puede actualizar contrapartes" ON case_counterparties
    FOR UPDATE USING (
        (is_admin() OR is_abogado() OR is_analista()) AND has_case_access(case_id)
    );

CREATE POLICY "Staff puede eliminar contrapartes" ON case_counterparties
    FOR DELETE USING (
        (is_admin() OR is_abogado() OR is_analista()) AND has_case_access(case_id)
    );

COMMIT;
-- Messaging between abogados y clientes
CREATE TABLE case_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    sender_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    audience TEXT CHECK (audience IN ('abogado','cliente','equipo')) DEFAULT 'equipo',
    contenido TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_case_messages_case_id ON case_messages(case_id);
CREATE INDEX idx_case_messages_sender ON case_messages(sender_profile_id);

ALTER TABLE case_messages ENABLE ROW LEVEL SECURITY;

-- Messaging RLS
CREATE POLICY "Participants read case messages" ON case_messages
    FOR SELECT USING (
        has_case_access(case_id)
    );

CREATE POLICY "Abogados y admin envían mensajes" ON case_messages
    FOR INSERT WITH CHECK (
        sender_profile_id = (SELECT id FROM get_current_profile())
        AND (SELECT role FROM profiles WHERE id = sender_profile_id) IN ('abogado','admin_firma')
        AND has_case_access(case_id)
    );

CREATE POLICY "Clientes responden sus casos" ON case_messages
    FOR INSERT WITH CHECK (
        sender_profile_id = (SELECT id FROM get_current_profile())
        AND (SELECT role FROM profiles WHERE id = sender_profile_id) = 'cliente'
        AND EXISTS (
            SELECT 1 FROM case_clients
            WHERE case_id = case_messages.case_id
              AND client_profile_id = sender_profile_id
        )
    );

CREATE POLICY "Solo autor modifica o elimina" ON case_messages
    FOR UPDATE USING (sender_profile_id = (SELECT id FROM get_current_profile()))
    WITH CHECK (sender_profile_id = (SELECT id FROM get_current_profile()));

CREATE POLICY "Solo autor elimina" ON case_messages
    FOR DELETE USING (sender_profile_id = (SELECT id FROM get_current_profile()));

-- Plantillas legales reutilizables
CREATE TABLE legal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT,
    content TEXT NOT NULL,
    is_shared BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE legal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates visibles por abogados y admin" ON legal_templates
    FOR SELECT USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('abogado','admin_firma')
    );

CREATE POLICY "Solo admin crea plantillas compartidas" ON legal_templates
    FOR INSERT WITH CHECK (
        (SELECT role FROM profiles WHERE id = created_by) = 'admin_firma'
        OR is_shared = false
    );

CREATE POLICY "Autor o admin actualiza" ON legal_templates
    FOR UPDATE USING (
        created_by = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin_firma'
    )
    WITH CHECK (
        created_by = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin_firma'
    );

CREATE POLICY "Autor o admin elimina" ON legal_templates
    FOR DELETE USING (
        created_by = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin_firma'
    );

-- Enlaces rápidos a portales clave
CREATE TABLE quick_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT,
    icon TEXT,
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quick_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Abogados y admin ven enlaces" ON quick_links
    FOR SELECT USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('abogado','admin_firma')
    );

CREATE POLICY "Abogados y admin crean enlaces" ON quick_links
    FOR INSERT WITH CHECK (
        (SELECT role FROM profiles WHERE id = created_by) IN ('abogado','admin_firma')
    );

CREATE POLICY "Autor o admin gestiona" ON quick_links
    FOR UPDATE USING (
        created_by = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin_firma'
    )
    WITH CHECK (
        created_by = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin_firma'
    );

CREATE POLICY "Autor o admin elimina" ON quick_links
    FOR DELETE USING (
        created_by = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin_firma'
    );

-- Seed básicos
INSERT INTO quick_links (title, url, category, icon, is_default)
VALUES
  ('Poder Judicial - Consulta Unificada', 'https://corte.pjud.cl/', 'Portales', 'gavel', true),
  ('Oficina Judicial Virtual', 'https://oficinajudicialvirtual.pjud.cl', 'Portales', 'scale', true),
  ('Diario Oficial', 'https://www.diariooficial.cl', 'Referencias', 'newspaper', true)
ON CONFLICT DO NOTHING;

INSERT INTO legal_templates (title, category, content, is_shared)
VALUES
  ('Carta Solicitud Documentación', 'Comunicaciones', 'Estimado cliente, necesitamos los siguientes documentos...', true),
  ('Acta de Reunión Interna', 'Interno', 'Participantes, acuerdos, próximos pasos...', true)
ON CONFLICT DO NOTHING;
-- 🧩 Migración para alinear tu BD con el código

-- 1) Asegurar que el enum user_role tenga 'analista'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'analista'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'analista';
  END IF;
END $$;

-- 2) Crear enum case_workflow_state si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_workflow_state') THEN
    CREATE TYPE case_workflow_state AS ENUM ('preparacion','en_revision','activo','cerrado');
  END IF;
END $$;

-- 3) Agregar columnas faltantes en cases (si no existen)
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS analista_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cliente_principal_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS workflow_state case_workflow_state DEFAULT 'activo',
  ADD COLUMN IF NOT EXISTS validado_at timestamptz;

-- (Opcional) normalizar defaults si hiciera falta
ALTER TABLE public.cases
  ALTER COLUMN workflow_state SET DEFAULT 'activo';
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'stage_audience_type'
  ) THEN
    CREATE TYPE stage_audience_type AS ENUM ('preparatoria', 'juicio');
  END IF;
END
$$;

ALTER TABLE case_stages
  ADD COLUMN IF NOT EXISTS audiencia_tipo stage_audience_type;

ALTER TABLE case_stages
  ADD COLUMN IF NOT EXISTS requiere_testigos BOOLEAN DEFAULT false;

UPDATE case_stages
SET requiere_testigos = false
WHERE requiere_testigos IS NULL;

ALTER TABLE case_stages
  ALTER COLUMN requiere_testigos SET NOT NULL;

COMMIT;
BEGIN;

CREATE OR REPLACE FUNCTION has_case_access(case_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_profile profiles;
BEGIN
    SELECT * INTO current_profile FROM get_current_profile();

    IF current_profile.id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Admins always have access
    IF current_profile.role = 'admin_firma' THEN
        RETURN TRUE;
    END IF;

    -- Analysts can access cases where they are assigned
    IF current_profile.role = 'analista' THEN
        RETURN EXISTS (
            SELECT 1
            FROM cases
            WHERE id = case_uuid
              AND analista_id = current_profile.id
        );
    END IF;

    -- Lawyers can access cases where they are responsible or collaborators
    IF current_profile.role = 'abogado' THEN
        RETURN EXISTS (
            SELECT 1
            FROM cases
            WHERE id = case_uuid
              AND (
                    abogado_responsable = current_profile.id
                 OR EXISTS (
                        SELECT 1
                        FROM case_collaborators
                        WHERE case_id = case_uuid
                          AND abogado_id = current_profile.id
                    )
              )
        );
    END IF;

    -- Clients can access cases where they are assigned
    IF current_profile.role = 'cliente' THEN
        RETURN EXISTS (
            SELECT 1
            FROM case_clients
            WHERE case_id = case_uuid
              AND client_profile_id = current_profile.id
        );
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
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

CREATE TRIGGER update_legal_connections_updated_at
    BEFORE UPDATE ON legal_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE legal_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select their legal connections"
    ON legal_connections
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert their legal connections"
    ON legal_connections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their legal connections"
    ON legal_connections
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

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

CREATE TRIGGER update_legal_sync_jobs_updated_at
    BEFORE UPDATE ON legal_sync_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE legal_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select their sync jobs"
    ON legal_sync_jobs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert their sync jobs"
    ON legal_sync_jobs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their sync jobs"
    ON legal_sync_jobs
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

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

CREATE TRIGGER update_legal_cases_updated_at
    BEFORE UPDATE ON legal_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select their synced cases"
    ON legal_cases
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert their synced cases"
    ON legal_cases
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their synced cases"
    ON legal_cases
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY "Users select their case events"
    ON legal_case_events
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert their case events"
    ON legal_case_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their case events"
    ON legal_case_events
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their case events"
    ON legal_case_events
    FOR DELETE
    USING (auth.uid() = user_id);
