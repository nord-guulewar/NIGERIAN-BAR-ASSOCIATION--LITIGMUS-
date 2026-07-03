# 🚀 NBA LITIGMUS - Deployment Options

## Current Deployment Baseline

The live architecture for NBA LITIGMUS is:

1. React frontend
2. Node.js and Express backend
3. PostgreSQL primary database
4. Redis cache and operational support
5. Optional Nginx reverse proxy and TLS termination

MongoDB-specific deployment instructions from older revisions should not be used for current environments.

## Deployment Modes

### Option 1: Docker

Best fit for cloud or container-friendly hosting.

```bash
npm run docker:build
npm run docker:up
npm run docker:logs
npm run docker:down
```

### Option 2: PM2

Best fit for VPS or dedicated Linux hosts.

```bash
cd backend
npm install
npm run start:prod
```

### Option 3: Node Cluster

Best fit when using a single machine and wanting multi-core backend workers.

```bash
cd backend
npm install
npm run start:cluster
```

### Option 4: Simple Node

Best fit for local development or low-friction smoke testing.

```bash
cd backend
npm install
npm start
```

## Required Environment Variables

Create the backend environment file and set the current stack variables:

```bash
cd backend
cp .env.example .env
```

```env
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace_with_a_long_random_secret
SESSION_SECRET=replace_with_a_long_random_secret
NODE_ENV=production
```

## PostgreSQL Setup

1. Provision a PostgreSQL instance.
2. Set `DATABASE_URL` to the correct connection string.
3. Ensure the target host accepts connections from the application runtime.
4. Run any required schema migrations or bootstrap steps.
5. If row-level security is desired, run the RLS rollout command:

```bash
cd backend
npm run db:apply-rls
```

## Redis Setup

Redis remains recommended for performance and operational support.

### Ubuntu or Debian

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Docker

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

## Nginx and TLS

For production ingress, use Nginx if you need reverse proxying, TLS termination, or static asset serving.

```bash
sudo apt install nginx
sudo cp nginx/nginx.conf /etc/nginx/sites-available/nba-litigmus
sudo ln -s /etc/nginx/sites-available/nba-litigmus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

For TLS:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Frontend Deployment

The frontend build now syncs repository policy documents before building.

```bash
cd frontend
npm install
npm run build
```

You can then serve `frontend/build/` with Nginx or a static hosting platform.

## Post-Deployment Checks

### Health Endpoint

```bash
curl http://localhost:5000/api/health
```

### Policy Sync

```bash
npm run sync:policies
```

### Frontend Legal Routes

Verify these routes load successfully after deploy:

1. `/privacy`
2. `/legal-compliance`
3. `/policies/terms-of-use`
4. `/policies/data-retention-and-deletion`

## Troubleshooting

### Backend Cannot Reach PostgreSQL

1. Confirm `DATABASE_URL` is correct.
2. Confirm the PostgreSQL host, port, database, and credentials are valid.
3. Confirm network access and firewall rules permit the connection.
4. Confirm SSL requirements match the provider configuration.

### Frontend Build Fails

1. Run `npm run sync:policies` at repo root.
2. Re-run `cd frontend && npm run build`.
3. Confirm the policy markdown files exist in `frontend/public/policies/`.

### Redis Unavailable

1. Confirm the Redis service is running.
2. Confirm `REDIS_URL` is correct.
3. Review backend logs for cache-connection failures.

## Deployment Checklist

- [ ] `DATABASE_URL` configured
- [ ] `REDIS_URL` configured
- [ ] backend dependencies installed
- [ ] frontend dependencies installed
- [ ] PostgreSQL reachable from runtime
- [ ] Redis reachable from runtime
- [ ] RLS applied if required
- [ ] frontend build completed
- [ ] health endpoint responds
- [ ] legal and policy routes verified

## Related Docs

1. `README.md`
2. `PRODUCTION_DEPLOYMENT.md`
3. `HOW_TO_RUN.md`
4. `INSTALLATION.md`
5. `QUICK_START.md`
