# Role-Unique Feature Roadmap (No-Regression Plan)

## Goal
Implement high-impact, role-specific daily workflow features without introducing new bugs.

## Non-Negotiable Safety Gates
1. Every feature ships behind a feature flag (default OFF in production).
2. Backend validation and role authorization required for every new endpoint.
3. Add integration tests before enabling each feature for users.
4. Run full smoke test across all role dashboards before merge.
5. If any regression is detected, feature flag stays OFF and release is blocked.

## Phase 1 (Quick Wins, 1-2 weeks)

### 1) Registrar: Smart Scheduling + Conflict Checker
Daily reality:
- Registrar schedules hearings and assigns judges while managing overload and clashes.

Feature scope:
- Detect judge/courtroom/date-time conflicts before save.
- Suggest next available hearing slots.
- Warn on overloaded judge daily case limits.

Backend additions:
- `POST /api/registrar/schedule/validate`
- `POST /api/registrar/schedule/suggest-slots`
- `POST /api/registrar/schedule-hearing/:caseId`

DB additions:
- `Case.hearingConflicts` (JSONB)
- `Case.schedulingAuditTrail` (JSONB)

UI additions:
- Registrar scheduling modal with conflict panel.
- Slot suggestion list with one-click apply.

Acceptance criteria:
- Cannot create conflicting hearing without explicit override reason.
- Suggestion API returns at least 3 valid slots when available.

---

### 2) Clerk: Filing Completeness + Missing Document Alerts
Daily reality:
- Clerk manages filing intake and document completeness.

Feature scope:
- Filing checklist per case type.
- Missing document alerts before case advances status.
- Deadline reminders for incomplete filings.

Backend additions:
- `GET /api/dashboard/clerk/filing-checklist/:caseId`
- `POST /api/dashboard/clerk/filing-checklist/:caseId`
- `GET /api/dashboard/clerk/incomplete-filings`

DB additions:
- `Case.requiredDocuments` (JSONB)
- `Case.filingChecklistStatus` (JSONB)
- `Case.filingDeadline` (DATE)

UI additions:
- Clerk checklist tab in dashboard.
- Missing-doc summary card + quick filter.

Acceptance criteria:
- Case cannot move to hearing-ready state when mandatory documents are missing.

---

### 3) Bailiff: Proof-of-Service Workflow
Daily reality:
- Bailiff serves summons and needs traceable service evidence.

Feature scope:
- Capture proof (notes + optional photo + timestamp + GPS if available).
- Structured failed-service reasons.
- Service SLA aging monitor.

Backend additions:
- `POST /api/dashboard/bailiff/proof-service/:summonsId`
- `POST /api/dashboard/bailiff/failure-reason/:summonsId`
- `GET /api/dashboard/bailiff/service-sla`

DB additions:
- `Summons.proofOfService` (JSONB)
- `Summons.failedServiceReason` (STRING)
- `Summons.serviceAttemptHistory` (JSONB)

UI additions:
- Bailiff service action modal with proof capture.
- SLA widget (due soon/overdue counts).

Acceptance criteria:
- Every served summons has immutable proof metadata logged.

## Phase 2 (Operational Control, 2-3 weeks)

### 4) Cashier + Accountant: Reconciliation and Variance Alerts
Daily reality:
- Cashier collects fees; accountant reconciles and monitors anomalies.

Feature scope:
- End-of-day till balancing.
- Auto variance alert if cashier report does not match ledger.
- Pending bank deposit aging panel.

Backend additions:
- `POST /api/dashboard/cashier/reconcile-day`
- `GET /api/dashboard/accountant/reconciliation-overview`
- `GET /api/dashboard/accountant/variance-alerts`

DB additions:
- `Payment.reconciliationStatus` (ENUM: pending, balanced, mismatch)
- `Payment.reconciliationBatchId` (STRING)
- `User.dailyCashSummary` (JSONB)

UI additions:
- Cashier reconciliation summary drawer.
- Accountant variance board with drill-down details.

Acceptance criteria:
- Variance > threshold is highlighted and cannot be dismissed without note.

---

### 5) Records Officer: Chain-of-Custody Tracking
Daily reality:
- Records team must track who handled each file and when.

Feature scope:
- File movement log for archive/retrieval transitions.
- Custody timeline per case.
- Overdue retrieval reminders.

Backend additions:
- `POST /api/dashboard/records/transfer-custody/:caseId`
- `GET /api/dashboard/records/custody-timeline/:caseId`
- `GET /api/dashboard/records/overdue-retrievals`

DB additions:
- `Case.custodyTrail` (JSONB)
- `Case.currentCustodianId` (UUID)
- `Case.retrievalDueAt` (DATE)

UI additions:
- Records timeline tab.
- Overdue retrieval queue.

Acceptance criteria:
- Every archive/retrieve action appends non-editable custody event.

## Phase 3 (Courtroom Performance, 2 weeks)

### Court Reporter + Usher + Security Coordination Board
Daily reality:
- These roles coordinate real-time courtroom operations.

Feature scope:
- Attendance roll and readiness checklist.
- Courtroom incident log integration.
- Transcript request queue visibility.

Backend additions:
- `GET /api/dashboard/reporter/session-queue`
- `POST /api/dashboard/usher/attendance/:hearingId`
- `GET /api/dashboard/security/courtroom-status`

DB additions:
- `Case.sessionReadiness` (JSONB)
- `SecurityLog.relatedHearingId` (UUID)

UI additions:
- Shared operations board (role-filtered views).

Acceptance criteria:
- Hearing readiness status updates reflect across reporter/usher/security dashboards.

## Regression Test Plan (Must Pass Before Enable)

### A) Auth and Access
1. Each role logs in and lands on correct dashboard.
2. Cross-role route access is blocked with redirect.
3. Mobile navigation sends each role to correct dashboard.

### B) Existing Critical Flows
1. Case creation and updates still work.
2. Payment processing and receipt generation still work.
3. Existing dashboard summaries load with no infinite loading.

### C) New Feature Tests
1. API validation tests for every new endpoint.
2. Role-based authorization tests for each endpoint.
3. UI tests for core action + failure states.

### D) Performance and Stability
1. No endpoint exceeds existing timeout baseline under normal load.
2. No console errors on role dashboards.
3. No new lint/type/build errors.

## Rollout Strategy
1. Build with feature flags OFF.
2. Enable per role in staging.
3. Run UAT with role owners.
4. Enable in production role-by-role.
5. Monitor logs and rollback by toggling flag OFF if needed.

## Suggested Feature Flag Names
- `FEATURE_REGISTRAR_SMART_SCHEDULING`
- `FEATURE_CLERK_FILING_CHECKLIST`
- `FEATURE_BAILIFF_PROOF_SERVICE`
- `FEATURE_FINANCE_RECONCILIATION_ALERTS`
- `FEATURE_RECORDS_CUSTODY_TRAIL`
- `FEATURE_COURTROOM_OPERATIONS_BOARD`

## Immediate Next Build Order
1. Registrar smart scheduling.
2. Clerk filing checklist.
3. Bailiff proof-of-service.
4. Finance reconciliation alerts.
5. Records custody trail.

This order gives the strongest operational benefit while minimizing risk and using existing dashboard route patterns.
