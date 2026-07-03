# Vercel + GitHub Deployment

This repository should be deployed to Vercel as two separate projects from the same GitHub repository:

- `frontend` as the web app
- `backend` as the API

## 1. Push the repository to GitHub

From the repository root:

```bash
git init
git add .
git commit -m "Prepare frontend and backend for Vercel deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

If the remote already exists, skip the `git remote add origin ...` step.

## 2. Create the backend Vercel project first

In Vercel:

- Import the GitHub repository
- Set the Root Directory to `backend`
- Framework Preset: `Other`

The backend uses `backend/vercel.json` and the serverless entrypoint at `backend/api/index.js`.

### Backend required environment variables

Set these in Vercel for the backend project:

```text
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://YOUR_FRONTEND_PROJECT.vercel.app
DATABASE_URL=YOUR_POSTGRES_CONNECTION_STRING
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
JWT_EXPIRE=7d
SESSION_SECRET=YOUR_LONG_RANDOM_SESSION_SECRET
ENCRYPTION_KEY=YOUR_32_CHARACTER_ENCRYPTION_KEY
REDIS_ENABLED=false
REDIS_URL=
```

### Backend Firebase bridge variables

Set these only if Firebase login bridge remains enabled:

```text
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

### Backend email variables

Use the provider your deployment actually relies on. Typical values from this codebase:

```text
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...
SMTP_HOST=...
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
```

### Backend optional variables

```text
PAYSTACK_SECRET_KEY=...
FLUTTERWAVE_SECRET_KEY=...
DPO_EMAIL=...
DPO_PHONE=...
SECURITY_EMAIL=...
DATA_RETENTION_PERIOD=2555
```

After deployment, note the backend URL, for example:

```text
https://your-backend-project.vercel.app
```

## 3. Create the frontend Vercel project

In Vercel:

- Import the same GitHub repository
- Set the Root Directory to `frontend`
- Framework Preset: `Create React App`
- Build Command: `npm run build`
- Output Directory: `build`

The frontend uses `frontend/vercel.json` for SPA rewrites.

### Frontend required environment variables

```text
REACT_APP_API_URL=https://YOUR_BACKEND_PROJECT.vercel.app/api
```

### Frontend Firebase client variables

Set these only if Firebase login bridge remains enabled:

```text
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

## 4. Redeploy order

Deploy in this order:

1. Backend
2. Frontend

If the backend URL changes, update `REACT_APP_API_URL` in the frontend project and redeploy the frontend.

## 5. Important notes

- The frontend no longer falls back to `http://localhost:5000/api` in production.
- The static green preload screen has already been replaced with the dark boot screen.
- Redis is optional. If you do not have managed Redis, keep `REDIS_ENABLED=false`.
- This backend can run on Vercel, but a long-lived Node host may still be more stable for heavier traffic.

## 6. Quick verification checklist

After both projects deploy:

1. Open the frontend landing page and confirm the boot screen is dark, not green.
2. Open the admin login page and confirm the same dark preloader shows on refresh.
3. Test `/api/health` on the backend URL.
4. Test normal login.
5. Test the email verification login flow.
6. Confirm the browser network tab shows requests going to your Vercel backend URL, not localhost.