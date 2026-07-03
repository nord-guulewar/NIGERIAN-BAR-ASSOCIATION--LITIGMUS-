# 🔧 Legacy MongoDB Connection Guide

> **Legacy Notice:** This document reflects an older MongoDB-based architecture. The current application stack uses PostgreSQL as the primary database and Redis for caching and operational support. Use the PostgreSQL-based setup instructions in `README.md`, `INSTALLATION.md`, and `QUICK_START.md` for current deployments.

## ⚠️ **Current Issue**

```
Operation `users.findOne()` buffering timed out after 10000ms
```

This means the backend cannot connect to MongoDB Atlas.

---

## ✅ **Solution: Update MongoDB Connection**

### **Option 1: Use Your Existing MongoDB Atlas (Recommended)**

1. **Open your `.env` file:**
   ```bash
   cd backend
   nano .env
   ```

2. **Update the `MONGODB_URI` line:**
   ```env
   MONGODB_URI=mongodb+srv://olaleyelekanjoseph_db_user:oqu97fjoSEY9HW49@nba-db.bnwogte.mongodb.net/nba-litigmus?retryWrites=true&w=majority
   ```

3. **Whitelist Your IP in MongoDB Atlas:**
   - Go to https://cloud.mongodb.com
   - Click on "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for testing
   - Click "Confirm"

4. **Restart the backend:**
   ```bash
   killall -9 node
   cd backend
   npm start
   ```

---

### **Option 2: Create a New MongoDB Atlas Cluster (Free)**

1. **Go to MongoDB Atlas:**
   - Visit: https://cloud.mongodb.com
   - Sign up or log in

2. **Create a Free Cluster:**
   - Click "Build a Database"
   - Choose "M0 FREE" tier
   - Select a region close to you
   - Click "Create"

3. **Create Database User:**
   - Click "Database Access"
   - Click "Add New Database User"
   - Username: `nba_admin`
   - Password: Generate a secure password (save it!)
   - Click "Add User"

4. **Whitelist IP Address:**
   - Click "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String:**
   - Click "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://nba_admin:<password>@cluster0.xxxxx.mongodb.net/`

6. **Update `.env` file:**
   ```bash
   cd backend
   nano .env
   ```

   Replace the `MONGODB_URI` line with:
   ```env
   MONGODB_URI=mongodb+srv://nba_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/nba-litigmus?retryWrites=true&w=majority
   ```

   **Important:** Replace `YOUR_PASSWORD` with your actual password!

7. **Restart backend:**
   ```bash
   killall -9 node
   npm start
   ```

---

### **Option 3: Use Local MongoDB (Development Only)**

1. **Install MongoDB locally:**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install mongodb

   # macOS
   brew install mongodb-community
   brew services start mongodb-community
   ```

2. **Update `.env` file:**
   ```bash
   cd backend
   nano .env
   ```

   Change `MONGODB_URI` to:
   ```env
   MONGODB_URI=mongodb://localhost:27017/nba-litigmus
   ```

3. **Restart backend:**
   ```bash
   killall -9 node
   npm start
   ```

---

## 🧪 **Test the Connection**

### **1. Check if backend is running:**
```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{
  "status": "OK",
  "message": "NBA LITIGMUS API is running",
  "timestamp": "2026-05-26T..."
}
```

### **2. Test user registration:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "Password123!",
    "role": "clerk",
    "phoneNumber": "+2348012345678",
    "state": "LA",
    "court": "SHC",
    "lga": "IKJ",
    "courtDivision": "Lagos",
    "department": "Registry"
  }'
```

Should return:
```json
{
  "success": true,
  "message": "User registered successfully",
  ...
}
```

---

## 🔍 **Troubleshooting**

### **Still getting timeout error?**

1. **Check MongoDB Atlas IP Whitelist:**
   - Make sure 0.0.0.0/0 is added
   - Wait 1-2 minutes for changes to propagate

2. **Verify connection string:**
   ```bash
   cd backend
   cat .env | grep MONGODB_URI
   ```

   Should show a valid MongoDB URI starting with `mongodb://` or `mongodb+srv://`

3. **Test internet connection:**
   ```bash
   ping google.com
   ```

4. **Check backend logs:**
   ```bash
   # Look for MongoDB connection messages
   tail -f backend/logs/out.log
   ```

5. **Verify MongoDB Atlas cluster is running:**
   - Go to https://cloud.mongodb.com
   - Check if cluster shows "Active" status

---

## 📝 **Quick Fix Commands**

### **Restart Everything:**
```bash
# Stop all Node processes
killall -9 node

# Start backend
cd backend
npm start &

# Start frontend (in new terminal)
cd frontend
npm start
```

### **Check what's running:**
```bash
# Check port 5000 (backend)
lsof -ti:5000

# Check port 3000 (frontend)
lsof -ti:3000
```

---

## ✅ **Success Indicators**

When MongoDB is connected successfully, you'll see:
```
✅ MongoDB connected successfully
📊 Database: nba-litigmus
```

And you can:
- ✅ Register users
- ✅ Login
- ✅ Create cases
- ✅ Access dashboards

---

## 🆘 **Still Having Issues?**

### **Quick Test - Use the existing connection:**

The `.env.example` already has a MongoDB URI. Try this:

```bash
cd backend

# Copy the example env
cp .env.example .env

# Restart
killall -9 node
npm start
```

Then test: http://localhost:3000

---

## 📞 **Need Help?**

Check these files for more info:
- `PRODUCTION_DEPLOYMENT.md` - Full deployment guide
- `DEPLOYMENT_OPTIONS.md` - Different deployment methods
- `README.md` - Quick start guide

---

**Once MongoDB is connected, your application will work perfectly!** 🏛️🇳🇬
