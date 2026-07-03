-- ============================================================
--  002_indexes.sql
--  Performance indexes for the NBA Litigmus database.
--
--  All indexes use CREATE INDEX IF NOT EXISTS so this file
--  is safe to re-run on an existing database.
--
--  Naming convention:
--    idx_<table>_<columns>
--    idx_<table>_<columns>_partial  (partial index)
--    idx_<table>_<jsonb_field>_gin  (GIN index on JSONB)
-- ============================================================


-- ============================================================
--  CASES
-- ============================================================

-- Primary access pattern: fetch cases for a given state + court
CREATE INDEX IF NOT EXISTS idx_cases_state_court
  ON cases (state, "courtType");

-- Filter by state + status (most dashboard views)
CREATE INDEX IF NOT EXISTS idx_cases_state_status
  ON cases (state, status);

-- Judge workload view: cases assigned to a specific judge
CREATE INDEX IF NOT EXISTS idx_cases_assigned_judge
  ON cases ("assignedJudge");

-- Chronological listing / reports
CREATE INDEX IF NOT EXISTS idx_cases_filing_date
  ON cases ("filingDate" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_cases_created_at
  ON cases ("createdAt" DESC NULLS LAST);

-- Case lookup by number (already unique, but explicit for EXPLAIN plans)
CREATE INDEX IF NOT EXISTS idx_cases_case_number
  ON cases ("caseNumber");

CREATE INDEX IF NOT EXISTS idx_cases_suit_number
  ON cases ("suitNumber")
  WHERE "suitNumber" IS NOT NULL;

-- Compound: state + court + status  (registrar/clerk dashboard)
CREATE INDEX IF NOT EXISTS idx_cases_state_court_status
  ON cases (state, "courtType", status);

-- Compound: state + court + assigned judge  (judge list within a court)
CREATE INDEX IF NOT EXISTS idx_cases_state_court_judge
  ON cases (state, "courtType", "assignedJudge");

-- Partial: only active / in-progress cases (most queries skip closed ones)
CREATE INDEX IF NOT EXISTS idx_cases_active_partial
  ON cases (state, "courtType", "filingDate" DESC NULLS LAST)
  WHERE status NOT IN ('Closed', 'Dismissed', 'Settled');

-- Payment status on the JSONB fees column (for accountant dashboard)
CREATE INDEX IF NOT EXISTS idx_cases_fees_payment_status_gin
  ON cases USING GIN (fees jsonb_path_ops);

-- Documents blob (full-text / existence queries)
CREATE INDEX IF NOT EXISTS idx_cases_documents_gin
  ON cases USING GIN (documents jsonb_path_ops);

-- Transaction ID lookup (payment verification)
CREATE INDEX IF NOT EXISTS idx_cases_transaction_id
  ON cases ("transactionId")
  WHERE "transactionId" IS NOT NULL;


-- ============================================================
--  USERS
-- ============================================================

-- Role-based lookups (admin, judge assignment, clerk list)
CREATE INDEX IF NOT EXISTS idx_users_role
  ON users (role);

-- State + court roster  (most role-based dashboards)
CREATE INDEX IF NOT EXISTS idx_users_state_court
  ON users (state, court);

-- Compound: state + court + role  (exact match for assignment queries)
CREATE INDEX IF NOT EXISTS idx_users_state_court_role
  ON users (state, court, role);

-- Email lookup (login, notification dispatch)
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users (email);

-- Staff ID lookup (credential generation)
CREATE INDEX IF NOT EXISTS idx_users_staff_id
  ON users ("staffId")
  WHERE "staffId" IS NOT NULL;

-- Partial: active, verified users only (skips disabled/unverified rows)
CREATE INDEX IF NOT EXISTS idx_users_active_verified_partial
  ON users (role, state, court)
  WHERE "isActive" = true AND "isVerified" = true;

-- Judge specialties JSONB
CREATE INDEX IF NOT EXISTS idx_users_specialties_gin
  ON users USING GIN (specialties jsonb_path_ops);


-- ============================================================
--  AUDIT LOGS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON audit_logs ("userId");

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs ("createdAt" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs ("entityType", "entityId");


-- ============================================================
--  PAYMENTS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_payments_case_id
  ON payments ("caseId");

CREATE INDEX IF NOT EXISTS idx_payments_paid_by
  ON payments ("paidBy");

CREATE INDEX IF NOT EXISTS idx_payments_status_created
  ON payments (status, "createdAt" DESC NULLS LAST);


-- ============================================================
--  DOCKETS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_dockets_case_id
  ON dockets ("caseId");

CREATE INDEX IF NOT EXISTS idx_dockets_judge_date
  ON dockets ("judgeId", "hearingDate");


-- ============================================================
--  NOTIFICATIONS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON notifications ("recipientId", "createdAt" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_notifications_unread_partial
  ON notifications ("recipientId", "createdAt" DESC NULLS LAST)
  WHERE "isRead" = false;


-- ============================================================
--  SECURITY LOGS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_security_logs_user_id
  ON security_logs ("userId");

CREATE INDEX IF NOT EXISTS idx_security_logs_created_at
  ON security_logs ("createdAt" DESC NULLS LAST);


-- ============================================================
--  FINES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_fines_case_id
  ON fines ("caseId");

CREATE INDEX IF NOT EXISTS idx_fines_imposed_by
  ON fines ("imposedBy");


-- ============================================================
--  SUMMONS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_summons_case_id
  ON summons ("caseId");


-- ============================================================
--  RESEARCH REQUESTS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_research_requests_case_id
  ON research_requests ("caseId");

CREATE INDEX IF NOT EXISTS idx_research_requests_assigned
  ON research_requests ("assignedToResearch");
