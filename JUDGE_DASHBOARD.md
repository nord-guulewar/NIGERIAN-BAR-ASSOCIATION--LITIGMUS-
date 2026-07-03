# 🏛️ Judge Dashboard - NBA LITIGMUS

## Overview

The Judge Dashboard is a specialized interface for judges to manage their assigned cases, deliver judgments, adjourn cases, and transfer cases to other judges. The system ensures no judge handles more than **15 cases per day** and provides real-time notifications to court staff.

---

## ✨ Features

### 1. **Time-Based Greeting**
- **Good Morning** (12:00 AM - 11:59 AM)
- **Good Afternoon** (12:00 PM - 4:59 PM)
- **Good Evening** (5:00 PM - 11:59 PM)

### 2. **Dashboard Summary**
- Total assigned cases
- Pending cases
- Today's cases (max 15)
- Completed cases
- Adjourned cases

### 3. **Case Management**
- View all assigned cases
- View today's cases (limited to 15)
- View detailed case information
- Search and filter cases

### 4. **Judgment Delivery**
- Rich text editor for writing judgments
- Verdict selection:
  - In Favor of Plaintiff
  - In Favor of Defendant
  - Dismissed
  - Settled
  - Other
- Automatic notification to:
  - Court Registrar
  - Court Secretary
  - Records Officer

### 5. **Case Adjournment**
- Provide reason for adjournment
- Set next hearing date
- Automatic notification to:
  - Court Registrar
  - Court Secretary
  - Records Officer
- Updates case status to "Adjourned"

### 6. **Case Transfer**
- Transfer cases to available judges
- View available judges (those with < 15 cases today)
- Provide transfer reason
- Automatic notifications to:
  - New judge (case assignment)
  - Court staff (case transfer)
- Prevents overloading judges (15 case limit)

### 7. **15 Cases Per Day Limit**
- System enforces maximum of 15 cases per judge per day
- Prevents case assignment/transfer if limit reached
- Shows available judges based on their current load

---

## 🔌 API Endpoints

### Base URL: `/api/judge-dashboard`

All endpoints require authentication and judge role.

### 1. Get Dashboard Summary
```http
GET /api/judge-dashboard/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "greeting": "Good Morning",
    "judge": {
      "name": "Adewale Ogunleye",
      "role": "judge",
      "court": "SHC",
      "state": "LA"
    },
    "stats": {
      "totalCases": 45,
      "pendingCases": 12,
      "todaysCases": 8,
      "completedCases": 30,
      "adjournedCases": 3
    }
  }
}
```

### 2. Get Assigned Cases
```http
GET /api/judge-dashboard/cases?page=1&limit=15&status=Pending
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 15)
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "cases": [...],
    "pagination": {
      "page": 1,
      "limit": 15,
      "total": 45,
      "pages": 3
    }
  }
}
```

### 3. Get Today's Cases
```http
GET /api/judge-dashboard/cases/today
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cases": [...],
    "count": 8,
    "maxPerDay": 15
  }
}
```

### 4. Get Case Details
```http
GET /api/judge-dashboard/cases/:caseId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "case": {
      "caseNumber": "SHC/LA/123/2024",
      "title": "John Doe vs. Jane Smith",
      "caseType": "Civil",
      "status": "In Progress",
      "plaintiff": {...},
      "defendant": {...},
      "hearingDates": [...],
      "adjournments": [...],
      "judgment": {...}
    }
  }
}
```

### 5. Deliver Judgment
```http
POST /api/judge-dashboard/cases/:caseId/judgment
```

**Request Body:**
```json
{
  "judgmentText": "After careful consideration of all evidence...",
  "verdict": "In Favor of Plaintiff"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Judgment delivered successfully",
  "data": {
    "case": {...}
  }
}
```

**Notifications Sent To:**
- Court Registrar
- Court Secretary
- Records Officer

### 6. Adjourn Case
```http
POST /api/judge-dashboard/cases/:caseId/adjourn
```

**Request Body:**
```json
{
  "reason": "Awaiting additional evidence from plaintiff",
  "nextHearingDate": "2024-06-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Case adjourned successfully",
  "data": {
    "case": {...}
  }
}
```

**Notifications Sent To:**
- Court Registrar
- Court Secretary
- Records Officer

### 7. Transfer Case
```http
POST /api/judge-dashboard/cases/:caseId/transfer
```

**Request Body:**
```json
{
  "toJudgeId": "60d5ec49f1b2c72b8c8e4f3a",
  "reason": "Case requires specialized expertise in commercial law"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Case transferred successfully",
  "data": {
    "case": {...}
  }
}
```

**Validations:**
- Target judge must exist and be active
- Target judge must have < 15 cases today
- Only assigned judge can transfer

**Notifications Sent To:**
- New judge (case assignment)
- Court Registrar
- Court Secretary
- Records Officer

### 8. Get Available Judges
```http
GET /api/judge-dashboard/available-judges?courtType=SHC&state=LA
```

**Query Parameters:**
- `courtType` (optional): Filter by court type
- `state` (optional): Filter by state

**Response:**
```json
{
  "success": true,
  "data": {
    "judges": [
      {
        "_id": "60d5ec49f1b2c72b8c8e4f3a",
        "name": "Ibrahim Mohammed",
        "court": "SHC",
        "state": "LA",
        "supremeCourtNumber": "SC/12345/2015",
        "todaysCases": 7,
        "available": true
      }
    ]
  }
}
```

---

## 📊 Database Models

### Case Model Updates

```javascript
{
  assignedJudge: ObjectId (ref: User),
  assignedDate: Date,
  assignedBy: ObjectId (ref: User),
  
  judgment: {
    text: String,
    deliveredBy: ObjectId (ref: User),
    deliveredDate: Date,
    verdict: String
  },
  
  adjournments: [{
    reason: String,
    adjournedBy: ObjectId (ref: User),
    adjournedDate: Date,
    nextHearingDate: Date,
    notifiedUsers: [{
      user: ObjectId (ref: User),
      role: String,
      notifiedAt: Date
    }]
  }],
  
  caseTransfers: [{
    fromJudge: ObjectId (ref: User),
    toJudge: ObjectId (ref: User),
    reason: String,
    transferDate: Date,
    transferredBy: ObjectId (ref: User)
  }]
}
```

### Notification Model

```javascript
{
  recipient: ObjectId (ref: User),
  sender: ObjectId (ref: User),
  type: String, // 'case_assigned', 'judgment_delivered', 'case_adjourned', 'case_transferred'
  title: String,
  message: String,
  relatedCase: ObjectId (ref: Case),
  relatedCaseNumber: String,
  read: Boolean,
  readAt: Date,
  priority: String,
  metadata: Mixed
}
```

---

## 🔔 Notification System

### Notification Types

1. **case_assigned** - When a case is assigned/transferred to a judge
2. **judgment_delivered** - When a judge delivers judgment
3. **case_adjourned** - When a judge adjourns a case
4. **case_transferred** - When a case is transferred to another judge

### Recipients by Action

| Action | Recipients |
|--------|-----------|
| Deliver Judgment | Registrar, Secretary, Records Officer |
| Adjourn Case | Registrar, Secretary, Records Officer |
| Transfer Case | New Judge, Registrar, Secretary, Records Officer |

### Notification Criteria

Notifications are sent to staff members who:
- Have roles: `registrar`, `secretary`, or `record_officer`
- Work in the same `state` as the case
- Work in the same `court` as the case
- Have `isActive: true`

---

## ⚖️ Business Rules

### 1. Case Assignment Limit
- **Maximum:** 15 cases per judge per day
- **Enforcement:** System prevents assignment/transfer if limit reached
- **Calculation:** Based on scheduled hearings for current date

### 2. Authorization
- Only the assigned judge can:
  - Deliver judgment on a case
  - Adjourn a case
  - Transfer a case

### 3. Case Status Updates
- **Judgment Delivered:** Status → "Judgement Reserved"
- **Case Adjourned:** Status → "Adjourned"
- **Case Transferred:** Assigned judge updated, new hearing scheduled

### 4. Audit Trail
- All actions tracked with:
  - User who performed action
  - Timestamp
  - Reason (for transfers/adjournments)
  - Notified users

---

## 🎨 Frontend Components (To Be Created)

### 1. JudgeDashboard.js
- Main dashboard with greeting and stats
- Today's cases list
- Quick actions

### 2. CaseList.js
- Paginated list of assigned cases
- Filters and search
- Status indicators

### 3. CaseDetails.js
- Full case information
- Timeline of events
- Action buttons

### 4. JudgmentEditor.js
- Rich text editor for judgment
- Verdict selection
- Save and submit

### 5. AdjournmentForm.js
- Reason input
- Date picker for next hearing
- Submit button

### 6. CaseTransferModal.js
- Available judges list
- Reason input
- Confirm transfer

---

## 🚀 Getting Started

### Backend Setup

1. **Restart Backend Server:**
```bash
cd backend
killall -9 node
node server.js
```

2. **Test Endpoints:**
```bash
# Get dashboard summary (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/judge-dashboard/summary

# Get today's cases
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/judge-dashboard/cases/today
```

### Frontend Integration (Next Steps)

1. Create Judge Dashboard component
2. Add API service methods
3. Implement judgment editor
4. Create adjournment form
5. Build case transfer interface

---

## 📝 Example Workflows

### Workflow 1: Deliver Judgment

1. Judge logs in → Sees greeting and dashboard
2. Clicks on a case from "Today's Cases"
3. Reviews case details
4. Clicks "Deliver Judgment"
5. Writes judgment in text editor
6. Selects verdict
7. Submits judgment
8. System notifies Registrar, Secretary, Records Officer
9. Case status updated to "Judgement Reserved"

### Workflow 2: Adjourn Case

1. Judge opens case details
2. Clicks "Adjourn Case"
3. Enters reason for adjournment
4. Selects next hearing date
5. Submits adjournment
6. System notifies Registrar, Secretary, Records Officer
7. New hearing date added to case
8. Case status updated to "Adjourned"

### Workflow 3: Transfer Case

1. Judge opens case details
2. Clicks "Transfer Case"
3. Views list of available judges (< 15 cases today)
4. Selects target judge
5. Enters transfer reason
6. Confirms transfer
7. System validates judge availability
8. Case reassigned to new judge
9. Notifications sent to new judge and staff

---

## ✅ Summary

The Judge Dashboard provides a complete case management system with:

✅ Time-based personalized greeting
✅ Real-time case statistics
✅ 15 cases per day limit enforcement
✅ Judgment delivery with text editor
✅ Case adjournment with notifications
✅ Case transfer to available judges
✅ Automatic staff notifications
✅ Complete audit trail
✅ Role-based access control

**Backend is complete and ready! Frontend components to be created next.**

---

🏛️ **Nigerian Bar Association** | **LITIGMUS Judge Dashboard v1.0.0**
