# 🚀 HOW TO RUN NBA LITIGMUS

## ⚠️ IMPORTANT: The HTML File Alone Won't Work!

The `index.html` file is just a **template**. It needs React to run and display content.

Think of it like this:
- `index.html` = Empty container
- React App = The actual content that fills the container

## ✅ To See the Application, Follow These Steps:

### Step 1: Install Prerequisites

You need these installed on your computer:

1. **Node.js** (v16 or higher)
   - Download: https://nodejs.org/
   - Check if installed: `node --version`

2. **PostgreSQL** (v14 or higher recommended)
   - Check if installed: `psql --version`

3. **Redis** (v6 or higher recommended)
   - Check if installed: `redis-server --version`

### Step 2: Start PostgreSQL and Redis

Open a terminal and run:

```bash
# Ubuntu/Linux
sudo systemctl start postgresql
sudo systemctl status postgresql
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

Open a terminal in the project folder:

```bash
# Navigate to backend folder
cd backend

# Install dependencies (first time only)
npm install

# Create environment file
cp .env.example .env

# Create test data (first time only)
npm run seed

# Start the backend server
npm start
```

You should see:
```
NBA LITIGMUS Server running on port 5000
Environment: development
PostgreSQL connected successfully
```

**Keep this terminal open!**

### Step 4: Setup Frontend

Open a **NEW terminal** (keep the backend running):

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (first time only)
npm install

# Start the React app
npm start
```

You should see:
```
Compiled successfully!

You can now view nba-litigmus-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

**A browser window will automatically open!**

### Step 5: View the Application

The application will open automatically at:
```
http://localhost:3000
```

You'll see:
1. **NBA Green loading screen** with scales of justice
2. Then the **Login/Register page** with NBA branding
3. Green and gold color scheme throughout

## 🎨 What You'll See

### Loading Screen (1-2 seconds)
- NBA green gradient background
- White circle with scales of justice icon
- "NBA LITIGMUS" text
- Spinning loader
- "Justice • Technology • Excellence"

### Login Page
- NBA green gradient background with animated gold overlay
- White card with gold top border
- Two tabs: "Login" and "Register"
- NBA branding throughout

### After Login
- Green sidebar with gold accents
- Dashboard with analytics
- All features working

## 🔑 Test Login Credentials

After running `npm run seed` in the backend, use:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nba.org.ng | Admin@123 |
| Registrar | registrar@nba.org.ng | Registrar@123 |
| Clerk | clerk@nba.org.ng | Clerk@123 |

Or create your own account using the **Register** tab!

## ❌ Common Issues

### "Nothing displays when I open index.html"
**Problem**: You're opening the HTML file directly in the browser.

**Solution**: You MUST run `npm start` in the frontend folder. React needs to compile and serve the app.

### "npm: command not found"
**Problem**: Node.js is not installed.

**Solution**: Download and install Node.js from https://nodejs.org/

### "Cannot connect to MongoDB"
**Problem**: MongoDB is not running.

**Solution**: Start MongoDB using the commands in Step 2.

### "Port 3000 already in use"
**Problem**: Another app is using port 3000.

**Solution**: 
- Stop the other app, or
- The terminal will ask if you want to use a different port - type 'y'

### "Module not found" errors
**Problem**: Dependencies not installed.

**Solution**: Run `npm install` in both backend and frontend folders.

## 📱 Accessing from Other Devices

Once running, you can access from:
- **Same computer**: http://localhost:3000
- **Other devices on same network**: http://YOUR_IP:3000
  (The terminal will show your network IP)

## 🛑 How to Stop

To stop the application:

1. **Frontend**: Press `Ctrl+C` in the frontend terminal
2. **Backend**: Press `Ctrl+C` in the backend terminal
3. **MongoDB**: 
   ```bash
   # Ubuntu/Linux
   sudo systemctl stop mongodb
   
   # macOS
   brew services stop mongodb-community
   
   # Windows
   net stop MongoDB
   ```

## 🔄 Running Again Later

Next time you want to run the app:

```bash
# Terminal 1: Start MongoDB
sudo systemctl start mongodb

# Terminal 2: Start Backend
cd backend
npm start

# Terminal 3: Start Frontend
cd frontend
npm start
```

No need to run `npm install` or `npm run seed` again!

## 🎨 NBA Branding Features

The application now has:

✅ **NBA Green Color Scheme**
- Primary: Dark Green (#1a472a)
- Secondary: Light Green (#2d5a3d)
- Accent: Gold (#d4af37)

✅ **Professional Loading Screen**
- Scales of justice icon
- NBA branding
- Smooth animations

✅ **Branded Login Page**
- Green gradient background
- Gold accents
- Professional appearance

✅ **Consistent Styling**
- Green sidebar with gold highlights
- Green buttons and links
- Gold for important elements

## 📞 Still Having Issues?

1. Check that both terminals are running (backend and frontend)
2. Check that MongoDB is running
3. Try restarting everything
4. Check the browser console for errors (F12)
5. Read the error messages carefully

## ✨ Summary

**DON'T**: Open `index.html` directly in browser ❌

**DO**: Run these commands ✅
```bash
# Terminal 1
cd backend && npm start

# Terminal 2  
cd frontend && npm start
```

Then visit: **http://localhost:3000**

---

**You'll see a beautiful NBA-branded application with green and gold colors!**

🏛️ **Justice • Technology • Excellence**
