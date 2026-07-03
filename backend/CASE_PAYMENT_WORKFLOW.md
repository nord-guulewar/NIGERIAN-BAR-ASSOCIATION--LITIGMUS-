# NBA LITIGMUS - Case Registration and Payment Workflow

## Overview
This document outlines the complete workflow for case registration, suit number assignment, fee calculation, and payment processing in the NBA LITIGMUS system.

## Key Features Implemented

### 1. Suit Number Generation
- **When**: Automatically generated when a case is assigned to a judge
- **Format**: `COURT/JUDGE_INITIALS/YEAR/SEQUENCE`
- **Example**: `SHC/OAA/2024/125`
  - SHC = State High Court
  - OAA = Judge's initials (Olukayode Ariwoola Adekunle)
  - 2024 = Year
  - 125 = Sequential number for that judge

### 2. Comprehensive Fee Structure
The system includes fee structures for all Nigerian court types:

#### Court Types Supported:
- **SC** - Supreme Court
- **CA** - Court of Appeal
- **FHC** - Federal High Court
- **SHC** - State High Court
- **SCA** - Sharia Court of Appeal
- **CCA** - Customary Court of Appeal
- **MC** - Magistrate Court
- **DC** - District Court

#### Fee Types:
- **Filing Fee**: Initial case registration fee
- **Hearing Fee**: Fee for each hearing session
- **Process Fee**: Fee for serving court processes
- **Bailiff Fee**: Fee for bailiff services
- **Judgment Fee**: Fee for judgment delivery

#### Example Fee Structure (State High Court - Civil Case):
- Filing Fee: ₦8,000
- Hearing Fee: ₦6,000
- Process Fee: ₦4,000
- Bailiff Fee: ₦2,500
- Judgment Fee: ₦12,000
- **Total: ₦32,500**

### 3. Automatic Fee Calculation
- Fees are automatically calculated when a case is registered
- Based on court type and case type
- All fees are summed to provide total amount due

## Complete Workflow

### Step 1: Case Registration
**Who can register**: Admin, Registrar, Clerk

**Endpoint**: `POST /api/registrar-dashboard/register-case`

**Process**:
1. Registrar/Clerk enters case details
2. System generates unique case number
3. System automatically calculates all applicable fees
4. Case is saved with status "Pending"
5. Clerks are notified

**Case Number Format**: `COURT/STATE/LGA/YEAR/SEQUENCE`
Example: `SHC/LA/IKJ/2024/001`

### Step 2: Case Assignment to Judge
**Who can assign**: Registrar

**Endpoint**: `POST /api/registrar-dashboard/assign-case/:caseId`

**Process**:
1. Registrar selects available judge
2. System generates **suit number** using judge's initials
3. Case status changes to "In Progress"
4. Hearing date is scheduled
5. Judge is notified with suit number
6. Secretary is notified to inform lawyers

**Suit Number Generated**: `SHC/OAA/2024/125`

### Step 3: Fee Viewing
**Who can view**: All authenticated users

**Endpoint**: `GET /api/fees/case/:caseId`

**Response includes**:
- Case number and suit number
- Breakdown of all fees
- Total amount
- Amount paid
- Balance
- Payment status (Unpaid/Partially Paid/Fully Paid)

### Step 4: Payment Processing
**Who can process**: Admin, Accountant, Cashier, Clerk

**Endpoint**: `POST /api/payment-portal/process/:caseId`

**Payment Portal Features**:
- **Role-based access control**
- **Admin**: Can process payments for all courts
- **Accountant**: Can process payments for their court, generate reports
- **Cashier**: Can process payments for their court, generate receipts
- **Clerk**: Can process payments for their court

**Process**:
1. User selects case from payment portal
2. Views fee breakdown
3. Enters payment details:
   - Payment method (Cash, Bank Transfer, Card, Cheque, Online, POS)
   - Payer information
   - Amount
   - Fee types being paid
4. System generates:
   - Receipt number
   - Transaction reference
5. Payment is recorded
6. Case payment status is updated
7. Receipt is generated

**Receipt Number Format**: `RCP/STATE/TYPE/YYYYMMDD/TIMESTAMP`
Example: `RCP/LA/FIL/20241127/123456`

### Step 5: Payment Tracking
**Endpoint**: `GET /api/payment-portal/`

**Features**:
- View pending payments
- View recent payments (last 7 days)
- Daily collection statistics
- Payment status breakdown

### Step 6: Daily Collection Report
**Who can access**: Admin, Accountant

**Endpoint**: `GET /api/payment-portal/daily-report?date=YYYY-MM-DD`

**Report includes**:
- Total collection for the day
- Number of transactions
- Breakdown by payment method
- Breakdown by payment type
- Individual transaction details

## Role-Based Permissions

### Case Registration
| Role | Can Register | Can View | Can Assign |
|------|-------------|----------|------------|
| Admin | ✅ | ✅ | ✅ |
| Registrar | ✅ | ✅ | ✅ |
| Clerk | ✅ | ✅ | ❌ |
| Judge | ❌ | ✅ (assigned only) | ❌ |
| Accountant | ❌ | ✅ | ❌ |
| Cashier | ❌ | ✅ | ❌ |

### Payment Processing
| Role | Can Process | Can View All | Can Generate Reports |
|------|------------|--------------|---------------------|
| Admin | ✅ (all courts) | ✅ | ✅ |
| Accountant | ✅ (own court) | ✅ (own court) | ✅ |
| Cashier | ✅ (own court) | ✅ (own court) | ❌ |
| Clerk | ✅ (own court) | ✅ (own court) | ❌ |

## API Endpoints Summary

### Case Management
- `POST /api/registrar-dashboard/register-case` - Register new case
- `POST /api/registrar-dashboard/assign-case/:caseId` - Assign to judge
- `GET /api/cases/:caseId` - Get case details

### Fee Management
- `GET /api/fees/structure?courtType=SHC&caseType=Civil` - Get fee structure
- `GET /api/fees/case/:caseId` - Get case fees
- `POST /api/fees/case/:caseId/payment` - Process payment (alternative endpoint)
- `GET /api/fees/receipt/:paymentId` - Get payment receipt

### Payment Portal
- `GET /api/payment-portal/` - Get payment portal dashboard
- `POST /api/payment-portal/process/:caseId` - Process payment
- `GET /api/payment-portal/daily-report` - Get daily collection report

## Example Usage Flow

### 1. Register a Case
```javascript
POST /api/registrar-dashboard/register-case
{
  "title": "John Doe vs Jane Smith",
  "caseType": "Civil",
  "plaintiff": {
    "name": "John Doe",
    "address": "123 Main St, Lagos",
    "phoneNumber": "08012345678",
    "lawyer": {
      "name": "Barrister Williams",
      "barNumber": "SC/12345/2020"
    }
  },
  "defendant": {
    "name": "Jane Smith",
    "address": "456 Oak Ave, Lagos"
  }
}

Response:
{
  "success": true,
  "data": {
    "caseNumber": "SHC/LA/IKJ/2024/001",
    "fees": {
      "totalAmount": 32500,
      "paymentStatus": "Unpaid"
    }
  }
}
```

### 2. Assign to Judge
```javascript
POST /api/registrar-dashboard/assign-case/[caseId]
{
  "judgeId": "judge_id_here",
  "hearingDate": "2024-12-15",
  "hearingTime": "10:00 AM"
}

Response:
{
  "success": true,
  "data": {
    "suitNumber": "SHC/OAA/2024/125",
    "caseNumber": "SHC/LA/IKJ/2024/001"
  }
}
```

### 3. Process Payment
```javascript
POST /api/payment-portal/process/[caseId]
{
  "feeTypes": ["filingFee", "hearingFee"],
  "totalAmount": 14000,
  "paymentMethod": "Bank Transfer",
  "payer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "08012345678"
  }
}

Response:
{
  "success": true,
  "data": {
    "receipt": {
      "receiptNumber": "RCP/LA/FIL/20241127/123456",
      "transactionReference": "TXN-1732742400-ABC123XYZ",
      "amount": 14000,
      "balance": 18500
    }
  }
}
```

## Security Features

1. **Role-based Access Control**: Each endpoint checks user role
2. **Court Jurisdiction**: Non-admin users can only access cases in their court
3. **Audit Trail**: All payments record who processed them
4. **Receipt Generation**: Unique receipt numbers for all transactions
5. **Transaction References**: Unique reference for each payment

## Database Schema Updates

### Case Model
- Added `suitNumber` field
- Enhanced `fees` object with detailed breakdown
- Added `payments` array to track all payments

### Payment Model
- Links to case via `relatedCase`
- Stores `receiptNumber` and `transactionReference`
- Records `processedBy` for audit trail

## Notes

1. **Suit numbers** are only generated when a case is assigned to a judge
2. **Fees** are automatically calculated based on court type and case type
3. **Payment portal** enforces strict role-based access
4. **Receipts** are automatically generated for all payments
5. **Balance tracking** is automatic and real-time
