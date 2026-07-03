# NBA LITIGMUS - Installation Guide

## Quick Start Guide

### Prerequisites
Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- PostgreSQL (v14 or higher recommended)
- Redis (v6 or higher recommended)
- npm (v8 or higher)

### Step 1: Clone or Download the Project
```bash
cd /path/to/NIGERIAN-BAR-ASSOCIATION (LITIGMUS)
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Configure Backend Environment
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nba_litigmus
JWT_SECRET=change_this_to_a_secure_random_string
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
```

### Step 4: Start PostgreSQL and Redis
```bash
# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl start redis-server

# macOS
brew services start postgresql
brew services start redis

# Windows
net start postgresql
net start redis
```

### Step 5: Start Backend Server
```bash
# From backend directory
npm start

# For development with auto-reload
npm run dev

# Optional: apply PostgreSQL row-level security
npm run db:apply-rls
```

The backend API will be available at: http://localhost:5000

### Step 6: Install Frontend Dependencies
Open a new terminal window:
```bash
cd frontend
npm install
```

### Step 7: Configure Frontend Environment (Optional)
Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Step 8: Start Frontend Application
```bash
# From frontend directory
npm start
```

The frontend will be available at: http://localhost:3000

## Creating Initial Admin User

You can create an admin user by making a POST request to the registration endpoint:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@nba.org.ng",
    "password": "Admin@123",
    "role": "admin",
    "phoneNumber": "08012345678",
    "state": "FC",
    "court": "FHC"
  }'
```

Or use the application's registration flow through the API.

## Verifying Installation

### Check Backend
Visit: http://localhost:5000/api/health

You should see:
```json
{
  "status": "OK",
  "message": "NBA LITIGMUS API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Check Frontend
Visit: http://localhost:3000

You should see the login page.

## Common Issues and Solutions

### MongoDB Connection Error
**Error**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution**: 
- Ensure MongoDB is running: `sudo systemctl status mongodb`
- Check MongoDB URI in `.env` file
- Verify MongoDB is listening on the correct port

### Port Already in Use
**Error**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
- Change the PORT in backend `.env` file
- Or kill the process using the port:
  ```bash
  # Find process
  lsof -i :5000
  # Kill process
  kill -9 <PID>
  ```

### npm Install Fails
**Solution**:
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### Frontend Can't Connect to Backend
**Solution**:
- Verify backend is running on http://localhost:5000
- Check CORS settings in backend
- Verify `REACT_APP_API_URL` in frontend `.env`

## Production Deployment

### Backend Production Setup
1. Set environment to production:
   ```env
   NODE_ENV=production
   ```

2. Use a process manager (PM2):
   ```bash
   npm install -g pm2
   pm2 start server.js --name nba-backend
   pm2 save
   pm2 startup
   ```

3. Set up Nginx reverse proxy:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Frontend Production Build
```bash
cd frontend
npm run build
```

Serve the `build` folder with a web server (Nginx, Apache, etc.)

### Database Backup
```bash
# Backup
mongodump --db nba-litigmus --out /backup/path

# Restore
mongorestore --db nba-litigmus /backup/path/nba-litigmus
```

## Next Steps

1. **Create Test Data**: Add judges, cases, and payments through the UI
2. **Configure Email**: Set up email settings in backend `.env` for notifications
3. **Customize**: Modify branding, colors, and features as needed
4. **Security**: Change default JWT secret and admin credentials
5. **Backup**: Set up automated database backups

## Support

For technical support:
- Email: support@nba.org.ng
- Documentation: See README.md

## License
Proprietary - Nigerian Bar Association
