# 🧪 API Testing Guide

## Quick Backend Test

### 1. Check if Backend is Running

Open your browser and visit:
```
http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "NBA LITIGMUS API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Test States API

Visit:
```
http://localhost:5000/api/states
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "states": [
      {
        "name": "Abia",
        "code": "AB",
        "capital": "Umuahia",
        "zone": "South East"
      },
      ...
    ],
    "count": 37
  }
}
```

### 3. Test LGAs API

Visit:
```
http://localhost:5000/api/lgas/state/LA
```

**Expected Response:**
```json
{
  "success": true,
  "count": 20,
  "data": {
    "stateCode": "LA",
    "lgas": [
      "Agege",
      "Ajeromi-Ifelodun",
      "Alimosho",
      ...
    ]
  }
}
```

### 4. Test Courts API

Visit:
```
http://localhost:5000/api/courts
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "courts": [
      {
        "name": "Supreme Court",
        "code": "SC",
        "level": 1,
        "jurisdiction": "Federal"
      },
      ...
    ],
    "count": 8
  }
}
```

## Troubleshooting

### Issue: Cannot connect to backend

**Check 1: Is backend running?**
```bash
cd backend
npm start
```

You should see:
```
NBA LITIGMUS Server running on port 5000
Environment: development
MongoDB connected successfully
```

**Check 2: Is MongoDB running?**
```bash
# Ubuntu/Linux
sudo systemctl status mongodb

# macOS
brew services list | grep mongodb

# Windows
sc query MongoDB
```

**Check 3: Check backend logs**
Look for errors in the terminal where backend is running.

### Issue: CORS Error

If you see CORS errors in browser console:

1. Check backend `.env` file has:
```
FRONTEND_URL=http://localhost:3000
```

2. Restart backend after changing `.env`

### Issue: States not loading in frontend

**Open Browser Console (F12)** and check for:

1. **Network Tab**: 
   - Look for request to `http://localhost:5000/api/states`
   - Check if it's successful (200) or failed (404, 500)

2. **Console Tab**:
   - Look for error messages
   - Should see: "Fetching states..." and "States loaded: 37"

3. **Check Response**:
   - Click on the `/api/states` request in Network tab
   - Check "Response" tab
   - Should show JSON with 37 states

## Manual Test Commands

### Using curl (Terminal)

```bash
# Test health
curl http://localhost:5000/api/health

# Test states
curl http://localhost:5000/api/states

# Test LGAs for Lagos
curl http://localhost:5000/api/lgas/state/LA

# Test courts
curl http://localhost:5000/api/courts
```

### Using Browser DevTools

1. Open browser console (F12)
2. Go to Console tab
3. Run:

```javascript
// Test states API
fetch('http://localhost:5000/api/states')
  .then(res => res.json())
  .then(data => console.log('States:', data))
  .catch(err => console.error('Error:', err));

// Test LGAs API
fetch('http://localhost:5000/api/lgas/state/LA')
  .then(res => res.json())
  .then(data => console.log('Lagos LGAs:', data))
  .catch(err => console.error('Error:', err));
```

## Common Issues & Solutions

### 1. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use different port in .env
PORT=5001
```

### 2. MongoDB Not Connected

**Error:** `MongoDB connection error`

**Solution:**
```bash
# Start MongoDB
sudo systemctl start mongodb

# Check if running
sudo systemctl status mongodb
```

### 3. Module Not Found

**Error:** `Cannot find module 'express-mongo-sanitize'`

**Solution:**
```bash
cd backend
npm install
```

### 4. Frontend Can't Connect

**Error:** `Network Error` or `ERR_CONNECTION_REFUSED`

**Check:**
1. Backend is running on port 5000
2. Frontend is running on port 3000
3. No firewall blocking connections
4. CORS is configured correctly

## Success Checklist

- [ ] Backend starts without errors
- [ ] MongoDB connects successfully
- [ ] Health endpoint returns OK
- [ ] States API returns 37 states
- [ ] LGAs API returns LGAs for selected state
- [ ] Courts API returns 8 court types
- [ ] Frontend loads without errors
- [ ] Browser console shows "States loaded: 37"
- [ ] State dropdown shows all 37 states
- [ ] LGA dropdown loads when state selected

## Next Steps

If all tests pass but states still don't show:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+Shift+R)
3. **Check React DevTools** - Inspect Login component state
4. **Check Network tab** - Look for failed requests
5. **Check Console** - Look for JavaScript errors

---

**Need Help?**

Check the console logs in:
1. Backend terminal
2. Browser DevTools Console
3. Browser DevTools Network tab

The error message will tell you exactly what's wrong!
