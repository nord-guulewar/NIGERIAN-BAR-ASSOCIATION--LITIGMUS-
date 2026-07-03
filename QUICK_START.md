# NBA LITIGMUS - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Prerequisites

Make sure you have installed:
- **Node.js** (v16+): Download from https://nodejs.org/
- **PostgreSQL** (v14+ recommended)
- **Redis** (v6+ recommended)

### Step 2: Start PostgreSQL and Redis

```bash
# Ubuntu/Linux - PostgreSQL
sudo systemctl start postgresql
sudo systemctl status postgresql

# Ubuntu/Linux - Redis
sudo systemctl start redis-server
sudo systemctl status redis-server

# macOS
brew services start postgresql
brew services start redis

# Windows
net start postgresql
net start redis
```

### Step 3: Setup Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure PostgreSQL connection in .env
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nba_litigmus

# Seed initial data (creates test users and judges)
npm run seed

# Start backend server
npm start

# Optional: apply PostgreSQL row-level security
npm run db:apply-rls
```

Backend will run on: **http://localhost:5000**

### Step 4: Setup Frontend

Open a **new terminal window**:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start frontend application
npm start
```

Frontend will run on: **http://localhost:3000**

### Step 5: Login to the System

The seed script creates test accounts for all roles:

| Role | Email | Password |
|------|-------|----------|
| **Administrator** | admin@nba.org.ng | Admin@123 |
| **Court Registrar** | registrar@nba.org.ng | Registrar@123 |
| **Court Clerk** | clerk@nba.org.ng | Clerk@123 |
| **Accountant** | accountant@nba.org.ng | Accountant@123 |
| **Bailiff** | bailiff@nba.org.ng | Bailiff@123 |
| **Secretary** | secretary@nba.org.ng | Secretary@123 |

### Step 6: Create Your Own Account

1. Go to http://localhost:3000
2. Click on the **"Register"** tab
3. Fill in your details:
   - First Name & Last Name
   - Email Address
   - Phone Number
   - Select your **Role** (Registrar, Judge, Bailiff, Secretary, Clerk, Accountant, Admin)
   - Select your **State**
   - Select your **Court Type**
   - Create a password (min. 6 characters)
4. Click **"Create Account"**
5. You'll be automatically logged in!

## 📋 What You Can Do

### As Administrator
- ✅ Register new cases
- ✅ Manage judges
- ✅ View all payments
- ✅ Generate reports
- ✅ Full system access

### As Court Registrar
- ✅ Register new cases
- ✅ Assign judges
- ✅ Update case status
- ✅ View reports

### As Judge
- ✅ View assigned cases
- ✅ Update case status
- ✅ Schedule hearings
- ✅ View workload

### As Court Clerk
- ✅ Register cases
- ✅ Update case information
- ✅ Record payments

### As Bailiff
- ✅ View cases
- ✅ Execute court orders
- ✅ Update case status

### As Secretary
- ✅ View cases
- ✅ Schedule hearings
- ✅ Manage documents

### As Accountant
- ✅ Record payments
- ✅ View payment reports
- ✅ Track due payments

## 🎯 Quick Tasks

### Register a New Case
1. Login to the system
2. Click **"Cases"** in the sidebar
3. Click **"Register New Case"** button
4. Fill in case details:
   - Case Title
   - Case Type (Civil, Criminal, Family, etc.)
   - Court Type (FHC, SHC, MC, etc.)
   - State
   - Plaintiff & Defendant information
   - Filing fee
5. Click **"Register Case"**
6. System automatically:
   - Generates unique case number
   - Assigns available judge
   - Creates case record

### View Judge Workload
1. Click **"Judges"** in sidebar
2. Click on any judge to view details
3. See:
   - Today's cases
   - Active cases
   - Total cases handled
   - Utilization rate

### Record a Payment
1. Click **"Payments"** in sidebar
2. View all payments, due payments, and overdue payments
3. Filter by state, court type, or payment type

### Generate Reports
1. Click **"Reports"** in sidebar
2. View:
   - Monthly case registration trends
   - Judge performance metrics
   - Payment summaries
   - Case distribution by type and state

## 🌐 Offline Support

The system works offline! When you're offline:
- ✅ Data is saved locally
- ✅ Automatic sync when back online
- ✅ No data loss
- ✅ Seamless experience

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check if MongoDB is running
sudo systemctl status mongodb

# Check if port 5000 is available
lsof -i :5000

# View backend logs
cd backend
npm start
```

### Frontend won't start
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Can't login
- Make sure backend is running on port 5000
- Check browser console for errors
- Verify email and password are correct
- Try creating a new account via Register tab

### MongoDB connection error
```bash
# Start MongoDB
sudo systemctl start mongodb

# Check MongoDB status
sudo systemctl status mongodb

# Verify connection string in backend/.env
MONGODB_URI=mongodb://localhost:27017/nba-litigmus
```

## 📱 Browser Support

Works best on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## 🎨 Features

### Case Management
- Automated case number generation
- Smart judge assignment
- Case status tracking
- Hearing scheduling
- Document management

### Judge Management
- Workload tracking
- Specialization matching
- Daily case limits
- Performance metrics

### Payment Processing
- Automated receipt generation
- Due date tracking
- Overdue alerts
- Payment reports

### Reporting & Analytics
- Dashboard with key metrics
- Monthly case trends
- Judge performance
- Payment summaries
- Exportable reports

## 📞 Support

Need help?
- 📧 Email: support@nba.org.ng
- 📖 Documentation: See README.md and INSTALLATION.md
- 🐛 Issues: Check NIGERIAN_COURTS_AND_STATES.md for reference

## 🔐 Security

- 🔒 JWT authentication
- 🔑 Password hashing
- 🛡️ Role-based access control
- 🚦 Rate limiting
- 🔐 Secure headers

## 📦 What's Included

### All 36 Nigerian States + FCT
From Abia (AB) to Zamfara (ZA), all states are supported!

### 8 Court Types
- Supreme Court (SC)
- Court of Appeal (CA)
- Federal High Court (FHC)
- State High Court (SHC)
- Sharia Court of Appeal (SCA)
- Customary Court of Appeal (CCA)
- Magistrate Court (MC)
- District Court (DC)

### 11 Case Types
Civil, Criminal, Family, Commercial, Land, Constitutional, Labour, Tax, Maritime, Election, Other

### 7 User Roles
Administrator, Registrar, Judge, Clerk, Accountant, Bailiff, Secretary

## 🎉 You're All Set!

Start managing cases efficiently with NBA LITIGMUS!

---

**Nigerian Bar Association** | **LITIGMUS Case Management System**
