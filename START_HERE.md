# 🏛️ NBA LITIGMUS - START HERE

## Welcome to the Nigerian Bar Association Case Management System!

This is your **complete, production-ready** case management system for Nigerian courts.

---

## ⚠️ IMPORTANT: How to View the Application

**The `index.html` file won't work by itself!** 

This is a **React application** - you need to run it with Node.js to see it work.

**Quick Start:**
```bash
# Terminal 1: Start backend
cd backend && npm install && npm run seed && npm start

# Terminal 2: Start frontend  
cd frontend && npm install && npm start
```

Then visit: **http://localhost:3000**

📖 **Detailed instructions**: Read **[HOW_TO_RUN.md](HOW_TO_RUN.md)**

---

## 🚀 Quick Start (Choose Your Path)

### 👨‍💻 For Developers
**Want to get it running in 5 minutes?**
→ Read **[QUICK_START.md](QUICK_START.md)**

### 📖 For Detailed Setup
**Need step-by-step installation instructions?**
→ Read **[INSTALLATION.md](INSTALLATION.md)**

### 🗺️ For Project Overview
**Want to understand the file structure?**
→ Read **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)**

### 📋 For Complete Checklist
**Want to verify everything is included?**
→ Read **[DOWNLOAD_CHECKLIST.md](DOWNLOAD_CHECKLIST.md)**

### 🇳🇬 For Nigerian Courts Reference
**Need information about states and courts?**
→ Read **[NIGERIAN_COURTS_AND_STATES.md](NIGERIAN_COURTS_AND_STATES.md)**

---

## 📦 What You Have

### ✅ Complete System
- **Backend API** (Node.js + Express + PostgreSQL)
- **Frontend App** (React + Bootstrap)
- **Database Models** (User, Case, Judge, Payment)
- **All 37 States** (36 states + FCT)
- **8 Court Types** (SC, CA, FHC, SHC, SCA, CCA, MC, DC)
- **7 User Roles** (Admin, Registrar, Judge, Clerk, Accountant, Bailiff, Secretary)
- **11 Case Types** (Civil, Criminal, Family, Commercial, etc.)
- **Offline Support** (Works without internet)

### ✅ Key Features
- 🔐 **Login & Registration** for all roles
- 📁 **Case Management** with auto case numbers
- ⚖️ **Judge Assignment** (automatic based on workload)
- 💰 **Payment Tracking** with receipts
- 📊 **Reports & Analytics** with charts
- 🌐 **Offline Mode** with auto-sync
- 📱 **Responsive Design** (works on all devices)
- 🔒 **Secure** (JWT auth, password hashing, role-based access)

---

## ⚡ Fastest Way to Start

### 1. Install Requirements
- Node.js v16+ → https://nodejs.org/
- PostgreSQL v14+ recommended
- Redis v6+ recommended

### 2. Start PostgreSQL and Redis
```bash
# Ubuntu/Linux
sudo systemctl start postgresql
sudo systemctl start redis-server

# macOS
brew services start postgresql
brew services start redis

# Windows
net start postgresql
net start redis
```

### 3. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm start
```

### 4. Setup Frontend (New Terminal)
```bash
cd frontend
npm install
npm start
```

### 5. Login
- Go to: http://localhost:3000
- Use test account: **admin@nba.org.ng** / **Admin@123**
- Or create your own account via **Register** tab!

---

## 🎯 What Can You Do?

### As Administrator
- ✅ Register new cases
- ✅ Manage judges
- ✅ View all payments
- ✅ Generate reports
- ✅ Full system access

### As Court Registrar
- ✅ Register cases
- ✅ Assign judges
- ✅ Update case status
- ✅ Schedule hearings

### As Judge
- ✅ View assigned cases
- ✅ Update case status
- ✅ View daily workload
- ✅ Schedule hearings

### As Court Clerk
- ✅ Register cases
- ✅ Update case info
- ✅ Record payments
- ✅ Generate receipts

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
- ✅ Track due/overdue payments

---

## 📚 Documentation Guide

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **START_HERE.md** (this file) | Overview & quick links | First! |
| **QUICK_START.md** | 5-minute setup guide | When you want to start fast |
| **INSTALLATION.md** | Detailed installation | When you need step-by-step help |
| **README.md** | Main documentation | For complete overview |
| **PROJECT_STRUCTURE.md** | File organization | When coding/customizing |
| **NIGERIAN_COURTS_AND_STATES.md** | Courts & states reference | For understanding the system |
| **DOWNLOAD_CHECKLIST.md** | Verify completeness | To check what's included |
| **requirements.txt** | Technical requirements | For system requirements |

---

## 🎓 System Overview

### How It Works

1. **User Registration/Login**
   - Users register with role (Registrar, Judge, Clerk, etc.)
   - Select their state and court
   - Login with email and password

2. **Case Registration**
   - Registrar/Clerk creates new case
   - System auto-generates case number (e.g., FHC/LA/CIV/00001/2024)
   - System auto-assigns available judge based on:
     - Court type match
     - State match
     - Case type specialization
     - Current workload

3. **Judge Management**
   - Judges have specializations (Civil, Criminal, etc.)
   - Daily case limits (e.g., max 5 cases/day)
   - Workload tracking
   - Performance metrics

4. **Payment Processing**
   - Record filing fees, hearing fees, etc.
   - Auto-generate receipt numbers
   - Track due dates
   - Flag overdue payments

5. **Reports & Analytics**
   - Dashboard with key metrics
   - Monthly case trends
   - Judge performance
   - Payment summaries

---

## 🔑 Test Accounts (After Running Seed)

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | admin@nba.org.ng | Admin@123 | Full access |
| **Registrar** | registrar@nba.org.ng | Registrar@123 | Case management |
| **Clerk** | clerk@nba.org.ng | Clerk@123 | Case entry |
| **Accountant** | accountant@nba.org.ng | Accountant@123 | Payments |
| **Bailiff** | bailiff@nba.org.ng | Bailiff@123 | Case execution |
| **Secretary** | secretary@nba.org.ng | Secretary@123 | Admin tasks |

---

## 🌐 URLs After Setup

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **API Docs**: See PROJECT_STRUCTURE.md for all endpoints

---

## 🎨 Technology Stack

### Backend
- **Runtime**: Node.js v16+
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Auth**: JWT + bcrypt
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Library**: React 18
- **Routing**: React Router v6
- **UI Framework**: Bootstrap 5
- **Icons**: Bootstrap Icons
- **Charts**: Chart.js
- **HTTP Client**: Axios
- **Offline**: PouchDB
- **Notifications**: React Toastify

---

## 📊 By the Numbers

- **29** API Endpoints
- **7** User Roles
- **37** Nigerian States (36 + FCT)
- **8** Court Types
- **11** Case Types
- **9** Payment Types
- **9** Frontend Pages
- **4** Database Models
- **7** Backend Routes
- **100%** Offline Support

---

## 🔧 Common Tasks

### Create a New Case
1. Login as Registrar/Clerk/Admin
2. Click "Cases" → "Register New Case"
3. Fill in case details
4. System auto-generates case number
5. System auto-assigns judge
6. Done!

### View Judge Workload
1. Login as any user
2. Click "Judges"
3. Click on any judge
4. See today's cases, active cases, utilization rate

### Record a Payment
1. Login as Accountant/Admin
2. Click "Payments"
3. View due/overdue payments
4. Record new payment with auto receipt number

### Generate Reports
1. Login as Admin
2. Click "Reports"
3. View monthly trends, judge performance, payment summaries

---

## 🐛 Troubleshooting

### Backend won't start?
```bash
# Check MongoDB is running
sudo systemctl status mongodb

# Check port 5000 is free
lsof -i :5000

# Reinstall dependencies
cd backend
rm -rf node_modules
npm install
```

### Frontend won't start?
```bash
# Clear and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Can't login?
- Make sure backend is running (http://localhost:5000)
- Check browser console for errors
- Try creating new account via Register tab
- Verify MongoDB is running

---

## 🚀 Next Steps

### After Setup
1. ✅ Login with test account
2. ✅ Create your own account
3. ✅ Register a test case
4. ✅ View dashboard
5. ✅ Explore all features

### For Production
1. Change JWT secret in `.env`
2. Update admin password
3. Configure email (optional)
4. Set up database backups
5. Enable HTTPS
6. Deploy to server

### For Customization
1. Update branding/logo
2. Change color scheme
3. Add custom features
4. Configure payment gateway
5. Add email notifications

---

## 📞 Need Help?

### Documentation
- **Quick Setup**: QUICK_START.md
- **Detailed Setup**: INSTALLATION.md
- **File Structure**: PROJECT_STRUCTURE.md
- **Courts Reference**: NIGERIAN_COURTS_AND_STATES.md

### Support
- 📧 Email: support@nba.org.ng
- 📖 Docs: All .md files in this folder

---

## ✨ Features Highlights

### 🔐 Security
- JWT authentication
- Password hashing
- Role-based access
- Rate limiting
- Secure headers

### 📱 User Experience
- Responsive design
- Offline support
- Real-time notifications
- Print-friendly pages
- Fast and intuitive

### 🎯 Automation
- Auto case number generation
- Auto judge assignment
- Auto receipt generation
- Auto workload tracking
- Auto payment status updates

### 📊 Analytics
- Dashboard metrics
- Monthly trends
- Judge performance
- Payment summaries
- Exportable reports

---

## 🎉 You're All Set!

Everything you need is in this folder:
- ✅ Complete source code
- ✅ Comprehensive documentation
- ✅ Test data seeding
- ✅ All Nigerian states & courts
- ✅ All user roles
- ✅ Offline support
- ✅ Security features

**Choose your path above and get started!**

---

## 📋 Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│  NBA LITIGMUS - Quick Reference                         │
├─────────────────────────────────────────────────────────┤
│  Frontend:  http://localhost:3000                       │
│  Backend:   http://localhost:5000                       │
│  Health:    http://localhost:5000/api/health            │
├─────────────────────────────────────────────────────────┤
│  Test Login: admin@nba.org.ng / Admin@123               │
├─────────────────────────────────────────────────────────┤
│  Start Backend:   cd backend && npm start               │
│  Start Frontend:  cd frontend && npm start              │
│  Seed Data:       cd backend && npm run seed            │
├─────────────────────────────────────────────────────────┤
│  Roles: Admin, Registrar, Judge, Clerk,                 │
│         Accountant, Bailiff, Secretary                  │
├─────────────────────────────────────────────────────────┤
│  States: All 36 + FCT (AB, AD, AK, ... ZA, FC)          │
│  Courts: SC, CA, FHC, SHC, SCA, CCA, MC, DC             │
└─────────────────────────────────────────────────────────┘
```

---

**Nigerian Bar Association** | **LITIGMUS Case Management System**

**Version 1.0.0** | **Built for the Nigerian Legal System**

**🏛️ Justice. Technology. Excellence.**
