CREATE OR REPLACE FUNCTION app_rls_current_setting(setting_name text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting(setting_name, true), '');
$$;

CREATE OR REPLACE FUNCTION app_rls_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(app_rls_current_setting('app.current_user_id'), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION app_rls_current_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT app_rls_current_setting('app.current_user_role');
$$;

CREATE OR REPLACE FUNCTION app_rls_current_state()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT app_rls_current_setting('app.current_state');
$$;

CREATE OR REPLACE FUNCTION app_rls_current_court()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT app_rls_current_setting('app.current_court');
$$;

CREATE OR REPLACE FUNCTION app_rls_current_court_division()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT app_rls_current_setting('app.current_court_division');
$$;

CREATE OR REPLACE FUNCTION app_rls_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT app_rls_current_role() = 'admin';
$$;

CREATE OR REPLACE FUNCTION app_rls_matches_state_case(user_state text, row_state text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT user_state IS NOT NULL AND row_state = user_state;
$$;

CREATE OR REPLACE FUNCTION app_rls_matches_state_and_court(user_state text, row_state text, user_court text, row_court text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT user_state IS NOT NULL
    AND user_court IS NOT NULL
    AND row_state = user_state
    AND row_court = user_court;
$$;

CREATE OR REPLACE FUNCTION app_rls_can_access_case_row(case_state text, case_court text, assigned_judge uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN app_rls_is_admin() THEN true
    WHEN app_rls_current_user_id() IS NULL THEN false
    WHEN app_rls_current_role() = 'judge' THEN app_rls_matches_state_and_court(app_rls_current_state(), case_state, app_rls_current_court(), case_court) AND assigned_judge = app_rls_current_user_id()
    WHEN app_rls_current_role() IN ('registrar', 'clerk', 'secretary', 'record_officer', 'court_reporter', 'litigation', 'prosecutor', 'probate', 'librarian') THEN app_rls_matches_state_and_court(app_rls_current_state(), case_state, app_rls_current_court(), case_court)
    WHEN app_rls_current_role() IN ('accountant', 'cashier') THEN app_rls_matches_state_and_court(app_rls_current_state(), case_state, app_rls_current_court(), case_court)
    WHEN app_rls_current_role() = 'bailiff' THEN app_rls_matches_state_and_court(app_rls_current_state(), case_state, app_rls_current_court(), case_court)
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION app_rls_can_manage_case_row(case_state text, case_court text, assigned_judge uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN app_rls_is_admin() THEN true
    WHEN app_rls_current_user_id() IS NULL THEN false
    WHEN app_rls_current_role() = 'judge' THEN app_rls_matches_state_and_court(app_rls_current_state(), case_state, app_rls_current_court(), case_court) AND assigned_judge = app_rls_current_user_id()
    WHEN app_rls_current_role() IN ('registrar', 'clerk', 'secretary', 'record_officer') THEN app_rls_matches_state_and_court(app_rls_current_state(), case_state, app_rls_current_court(), case_court)
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION app_rls_can_access_user_row(user_id uuid, user_state text, user_court text, user_role text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN app_rls_is_admin() THEN true
    WHEN app_rls_current_user_id() IS NULL THEN false
    WHEN user_id = app_rls_current_user_id() THEN true
    WHEN app_rls_current_role() = 'registrar' THEN app_rls_matches_state_and_court(app_rls_current_state(), user_state, app_rls_current_court(), user_court)
    WHEN app_rls_current_role() IN ('judge', 'clerk', 'secretary', 'record_officer', 'court_reporter', 'litigation', 'prosecutor', 'probate', 'librarian', 'accountant', 'cashier', 'bailiff', 'security') THEN app_rls_matches_state_and_court(app_rls_current_state(), user_state, app_rls_current_court(), user_court)
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION app_rls_can_manage_user_row(user_id uuid, user_state text, user_court text, user_role text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN app_rls_is_admin() THEN true
    WHEN app_rls_current_user_id() IS NULL THEN false
    WHEN user_id = app_rls_current_user_id() THEN true
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION app_rls_can_access_case_ref(case_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cases c
    WHERE c.id = case_id
      AND app_rls_can_access_case_row(c.state, c."courtType"::text, c."assignedJudge")
  );
$$;

CREATE OR REPLACE FUNCTION app_rls_can_manage_case_ref(case_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cases c
    WHERE c.id = case_id
      AND app_rls_can_manage_case_row(c.state, c."courtType"::text, c."assignedJudge")
  );
$$;

CREATE OR REPLACE FUNCTION app_rls_can_access_audit_log_row(actor_id uuid, case_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN app_rls_is_admin() THEN true
    WHEN app_rls_current_user_id() IS NULL THEN false
    WHEN actor_id = app_rls_current_user_id() THEN true
    WHEN case_id IS NOT NULL THEN app_rls_can_access_case_ref(case_id)
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION app_rls_can_insert_audit_log_row(actor_id uuid, case_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN app_rls_is_admin() THEN true
    WHEN app_rls_current_user_id() IS NULL THEN false
    WHEN actor_id = app_rls_current_user_id() THEN true
    WHEN case_id IS NOT NULL THEN app_rls_can_manage_case_ref(case_id)
    ELSE false
  END;
$$;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_modify_policy ON users;
CREATE POLICY users_select_policy ON users
  FOR SELECT
  USING (app_rls_can_access_user_row(id, state, court, role::text));
CREATE POLICY users_modify_policy ON users
  FOR ALL
  USING (app_rls_can_manage_user_row(id, state, court, role::text))
  WITH CHECK (app_rls_can_manage_user_row(id, state, court, role::text));

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cases_select_policy ON cases;
DROP POLICY IF EXISTS cases_modify_policy ON cases;
CREATE POLICY cases_select_policy ON cases
  FOR SELECT
  USING (app_rls_can_access_case_row(state, "courtType"::text, "assignedJudge"));
CREATE POLICY cases_modify_policy ON cases
  FOR ALL
  USING (app_rls_can_manage_case_row(state, "courtType"::text, "assignedJudge"))
  WITH CHECK (app_rls_can_manage_case_row(state, "courtType"::text, "assignedJudge"));

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_select_policy ON payments;
DROP POLICY IF EXISTS payments_modify_policy ON payments;
CREATE POLICY payments_select_policy ON payments
  FOR SELECT
  USING (
    app_rls_is_admin()
    OR (
      app_rls_current_role() IN ('accountant', 'cashier')
      AND app_rls_matches_state_and_court(app_rls_current_state(), state, app_rls_current_court(), "courtType")
    )
    OR ("processedBy" = app_rls_current_user_id())
    OR ("receivedBy" = app_rls_current_user_id())
  );
CREATE POLICY payments_modify_policy ON payments
  FOR ALL
  USING (
    app_rls_is_admin()
    OR (
      app_rls_current_role() IN ('accountant', 'cashier')
      AND app_rls_matches_state_and_court(app_rls_current_state(), state, app_rls_current_court(), "courtType")
    )
    OR ("processedBy" = app_rls_current_user_id())
    OR ("receivedBy" = app_rls_current_user_id())
  )
  WITH CHECK (
    app_rls_is_admin()
    OR (
      app_rls_current_role() IN ('accountant', 'cashier')
      AND app_rls_matches_state_and_court(app_rls_current_state(), state, app_rls_current_court(), "courtType")
    )
    OR ("processedBy" = app_rls_current_user_id())
    OR ("receivedBy" = app_rls_current_user_id())
  );

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_select_policy ON audit_logs;
DROP POLICY IF EXISTS audit_logs_insert_policy ON audit_logs;
CREATE POLICY audit_logs_select_policy ON audit_logs
  FOR SELECT
  USING (app_rls_can_access_audit_log_row("userId", "caseId"));
CREATE POLICY audit_logs_insert_policy ON audit_logs
  FOR INSERT
  WITH CHECK (app_rls_can_insert_audit_log_row("userId", "caseId"));

ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS security_logs_select_policy ON security_logs;
DROP POLICY IF EXISTS security_logs_insert_policy ON security_logs;
DROP POLICY IF EXISTS security_logs_update_policy ON security_logs;
CREATE POLICY security_logs_select_policy ON security_logs
  FOR SELECT
  USING (
    app_rls_is_admin()
    OR (
      app_rls_current_role() = 'security'
      AND officer = app_rls_current_user_id()
    )
  );
CREATE POLICY security_logs_insert_policy ON security_logs
  FOR INSERT
  WITH CHECK (
    app_rls_is_admin()
    OR (
      app_rls_current_role() = 'security'
      AND officer = app_rls_current_user_id()
    )
  );
CREATE POLICY security_logs_update_policy ON security_logs
  FOR UPDATE
  USING (
    app_rls_is_admin()
    OR (
      app_rls_current_role() = 'security'
      AND officer = app_rls_current_user_id()
    )
  )
  WITH CHECK (
    app_rls_is_admin()
    OR (
      app_rls_current_role() = 'security'
      AND officer = app_rls_current_user_id()
    )
  );

ALTER TABLE dockets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dockets FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dockets_select_policy ON dockets;
DROP POLICY IF EXISTS dockets_modify_policy ON dockets;
CREATE POLICY dockets_select_policy ON dockets
  FOR SELECT
  USING (
    app_rls_is_admin()
    OR ("sentTo" = app_rls_current_user_id())
    OR ("generatedBy" = app_rls_current_user_id())
    OR app_rls_can_access_case_ref("case")
  );
CREATE POLICY dockets_modify_policy ON dockets
  FOR ALL
  USING (
    app_rls_is_admin()
    OR ("generatedBy" = app_rls_current_user_id())
    OR app_rls_can_manage_case_ref("case")
  )
  WITH CHECK (
    app_rls_is_admin()
    OR ("generatedBy" = app_rls_current_user_id())
    OR app_rls_can_manage_case_ref("case")
  );

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_select_policy ON notifications;
DROP POLICY IF EXISTS notifications_modify_policy ON notifications;
CREATE POLICY notifications_select_policy ON notifications
  FOR SELECT
  USING (
    app_rls_is_admin()
    OR (recipient = app_rls_current_user_id())
    OR (sender = app_rls_current_user_id())
    OR (metadata ->> 'fromJudge' = COALESCE(app_rls_current_user_id()::text, ''))
  );
CREATE POLICY notifications_modify_policy ON notifications
  FOR ALL
  USING (
    app_rls_is_admin()
    OR (recipient = app_rls_current_user_id())
    OR (sender = app_rls_current_user_id())
    OR (metadata ->> 'fromJudge' = COALESCE(app_rls_current_user_id()::text, ''))
  )
  WITH CHECK (
    app_rls_is_admin()
    OR (recipient = app_rls_current_user_id())
    OR (sender = app_rls_current_user_id())
    OR (metadata ->> 'fromJudge' = COALESCE(app_rls_current_user_id()::text, ''))
  );

ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fines_select_policy ON fines;
DROP POLICY IF EXISTS fines_modify_policy ON fines;
CREATE POLICY fines_select_policy ON fines
  FOR SELECT
  USING (
    app_rls_is_admin()
    OR ("imposedBy" = app_rls_current_user_id())
    OR app_rls_can_access_case_ref("caseId")
  );
CREATE POLICY fines_modify_policy ON fines
  FOR ALL
  USING (
    app_rls_is_admin()
    OR ("imposedBy" = app_rls_current_user_id())
    OR app_rls_can_manage_case_ref("caseId")
  )
  WITH CHECK (
    app_rls_is_admin()
    OR ("imposedBy" = app_rls_current_user_id())
    OR app_rls_can_manage_case_ref("caseId")
  );

ALTER TABLE summons ENABLE ROW LEVEL SECURITY;
ALTER TABLE summons FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS summons_select_policy ON summons;
DROP POLICY IF EXISTS summons_modify_policy ON summons;
CREATE POLICY summons_select_policy ON summons
  FOR SELECT
  USING (
    app_rls_is_admin()
    OR ("issuedBy" = app_rls_current_user_id())
    OR ("assignedTo" = app_rls_current_user_id())
    OR app_rls_can_access_case_ref("case")
  );
CREATE POLICY summons_modify_policy ON summons
  FOR ALL
  USING (
    app_rls_is_admin()
    OR ("issuedBy" = app_rls_current_user_id())
    OR ("assignedTo" = app_rls_current_user_id())
    OR app_rls_can_manage_case_ref("case")
  )
  WITH CHECK (
    app_rls_is_admin()
    OR ("issuedBy" = app_rls_current_user_id())
    OR ("assignedTo" = app_rls_current_user_id())
    OR app_rls_can_manage_case_ref("case")
  );

ALTER TABLE research_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_requests FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS research_requests_select_policy ON research_requests;
DROP POLICY IF EXISTS research_requests_modify_policy ON research_requests;
CREATE POLICY research_requests_select_policy ON research_requests
  FOR SELECT
  USING (
    app_rls_is_admin()
    OR ("requestedBy" = app_rls_current_user_id())
    OR ("assignedTo" = app_rls_current_user_id())
    OR app_rls_can_access_case_ref("case")
  );
CREATE POLICY research_requests_modify_policy ON research_requests
  FOR ALL
  USING (
    app_rls_is_admin()
    OR ("requestedBy" = app_rls_current_user_id())
    OR ("assignedTo" = app_rls_current_user_id())
    OR app_rls_can_manage_case_ref("case")
  )
  WITH CHECK (
    app_rls_is_admin()
    OR ("requestedBy" = app_rls_current_user_id())
    OR ("assignedTo" = app_rls_current_user_id())
    OR app_rls_can_manage_case_ref("case")
  );