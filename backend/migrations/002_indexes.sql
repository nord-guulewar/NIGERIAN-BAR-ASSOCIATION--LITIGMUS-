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
  ON "Cases" (state, "courtType");

-- Filter by state + status (most dashboard views)
CREATE INDEX IF NOT EXISTS idx_cases_state_status
  ON "Cases" (state, status);

-- Judge workload view: cases assigned to a specific judge
CREATE INDEX IF NOT EXISTS idx_cases_assigned_judge
  ON "Cases" ("assignedJudge");

-- Chronological listing / reports
CREATE INDEX IF NOT EXISTS idx_cases_filing_date
  ON "Cases" ("filingDate" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_cases_created_at
  ON "Cases" ("createdAt" DESC NULLS LAST);

-- Case lookup by number (already unique, but explicit for EXPLAIN plans)
CREATE INDEX IF NOT EXISTS idx_cases_case_number
  ON "Cases" ("caseNumber");

CREATE INDEX IF NOT EXISTS idx_cases_suit_number
  ON "Cases" ("suitNumber")
  WHERE "suitNumber" IS NOT NULL;

-- Compound: state + court + status  (registrar/clerk dashboard)
CREATE INDEX IF NOT EXISTS idx_cases_state_court_status
  ON "Cases" (state, "courtType", status);

-- Compound: state + court + assigned judge  (judge list within a court)
CREATE INDEX IF NOT EXISTS idx_cases_state_court_judge
  ON "Cases" (state, "courtType", "assignedJudge");

-- Partial: only active / in-progress cases (most queries skip closed ones)
CREATE INDEX IF NOT EXISTS idx_cases_active_partial
  ON "Cases" (state, "courtType", "filingDate" DESC NULLS LAST)
  WHERE status NOT IN ('Closed', 'Dismissed', 'Settled');

-- Payment status on the JSONB fees column (for accountant dashboard)
CREATE INDEX IF NOT EXISTS idx_cases_fees_payment_status_gin
  ON "Cases" USING GIN ("fees" jsonb_path_ops);

-- Documents blob (full-text / existence queries)
CREATE INDEX IF NOT EXISTS idx_cases_documents_gin
  ON "Cases" USING GIN (documents jsonb_path_ops);

-- Transaction ID lookup (payment verification)
CREATE INDEX IF NOT EXISTS idx_cases_transaction_id
  ON "Cases" ("transactionId")
  WHERE "transactionId" IS NOT NULL;


-- ============================================================
--  USERS
-- ============================================================

-- Role-based lookups (admin, judge assignment, clerk list)
CREATE INDEX IF NOT EXISTS idx_users_role
  ON "Users" (role);

-- State + court roster  (most role-based dashboards)
CREATE INDEX IF NOT EXISTS idx_users_state_court
  ON "Users" (state, court);

-- Compound: state + court + role  (exact match for assignment queries)
CREATE INDEX IF NOT EXISTS idx_users_state_court_role
  ON "Users" (state, court, role);

-- Email lookup (login, notification dispatch)
CREATE INDEX IF NOT EXISTS idx_users_email
  ON "Users" (email);

-- Staff ID lookup (credential generation)
CREATE INDEX IF NOT EXISTS idx_users_staff_id
  ON "Users" ("staffId")
  WHERE "staffId" IS NOT NULL;

-- Partial: active, verified users only (skips disabled/unverified rows)
CREATE INDEX IF NOT EXISTS idx_users_active_verified_partial
  ON "Users" (role, state, court)
  WHERE "isActive" = true AND "isVerified" = true;

-- Judge specialties JSONB
CREATE INDEX IF NOT EXISTS idx_users_specialties_gin
  ON "Users" USING GIN (specialties jsonb_path_ops);


-- ============================================================
--  AUDIT LOGS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON "AuditLogs" ("userId");

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON "AuditLogs" ("createdAt" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON "AuditLogs" ("entityType", "entityId");


-- ============================================================
--  PAYMENTS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_payments_case_id
  ON "Payments" ("caseId");

CREATE INDEX IF NOT EXISTS idx_payments_paid_by
  ON "Payments" ("paidBy");

CREATE INDEX IF NOT EXISTS idx_payments_status_created
  ON "Payments" (status, "createdAt" DESC NULLS LAST);


-- ============================================================
--  DOCKETS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_dockets_case_id
  ON "Dockets" ("caseId");

CREATE INDEX IF NOT EXISTS idx_dockets_judge_date
  ON "Dockets" ("judgeId", "hearingDate");


-- ============================================================
--  NOTIFICATIONS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON "Notifications" ("recipientId", "createdAt" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_notifications_unread_partial
  ON "Notifications" ("recipientId", "createdAt" DESC NULLS LAST)
  WHERE "isRead" = false;


-- ============================================================
--  SECURITY LOGS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_security_logs_user_id
  ON "SecurityLogs" ("userId");

CREATE INDEX IF NOT EXISTS idx_security_logs_created_at
  ON "SecurityLogs" ("createdAt" DESC NULLS LAST);


-- ============================================================
--  FINES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_fines_case_id
  ON "Fines" ("caseId");

CREATE INDEX IF NOT EXISTS idx_fines_imposed_by
  ON "Fines" ("imposedBy");


-- ============================================================
--  SUMMONS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_summons_case_id
  ON "Summons" ("caseId");


-- ============================================================
--  RESEARCH REQUESTS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_research_requests_case_id
  ON "ResearchRequests" ("caseId");

CREATE INDEX IF NOT EXISTS idx_research_requests_assigned
  ON "ResearchRequests" ("assignedToResearch");
