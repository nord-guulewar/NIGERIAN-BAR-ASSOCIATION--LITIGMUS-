# NBA LITIGMUS - Project Structure

## Current Architecture Summary

NBA LITIGMUS is currently organized as a React frontend and a Node.js backend, with PostgreSQL as the primary datastore and Redis available for cache and operational support.

## Top-Level Structure

```text
NIGERIAN-BAR-ASSOCIATION (LITIGMUS)/
├── backend/                 Node.js, Express, Sequelize, scripts, migrations
├── frontend/                React application and public assets
├── nginx/                   reverse proxy and deployment configuration
├── docker-compose.yml       local container orchestration
├── README.md                primary project entrypoint
├── INSTALLATION.md          installation guide
├── QUICK_START.md           quick start guide
├── HOW_TO_RUN.md            runtime guide
└── policy documents         privacy, terms, retention, security, and governance
```

## Backend Structure

```text
backend/
├── config/                  database, cache, courts, states, fees, postgres config
├── controllers/             dashboard and feature controllers
├── db/                      adapters and request context helpers
├── middleware/              auth and request middleware
├── migrations/              SQL migrations, including RLS rollout
├── models/                  Sequelize-backed data models and compatibility layer usage
├── routes/                  API routes
├── scripts/                 operational scripts such as RLS application
├── utils/                   helpers and shared backend utilities
├── __tests__/               focused automated tests
├── server.js                backend entrypoint
└── package.json             backend scripts and dependencies
```

### Important Backend Areas

1. `config/postgres.js`: PostgreSQL bootstrap, connection management, and RLS request context support.
2. `db/requestContext.js`: request-scoped transaction storage for RLS-aware query execution.
3. `db/adapters/sequelizeAdapter.js`: compatibility layer that gives Mongoose-like access patterns over Sequelize.
4. `middleware/auth.js`: authentication and request-scoped transaction handling.
5. `migrations/001_enable_rls.sql`: PostgreSQL row-level security policies and helper functions.
6. `scripts/applyRls.js`: manual RLS rollout command.

## Frontend Structure

```text
frontend/
├── public/                  static assets and synced policy markdown files
│   └── policies/            markdown copies of repository policy documents
├── src/
│   ├── components/          layout, navigation, shared UI, public policy links
│   ├── context/             auth and shared React context
│   ├── pages/               dashboards, auth pages, public pages, policy renderer
│   ├── services/            API and offline sync support
│   ├── utils/               shared route and document metadata
│   ├── App.js               route registration
│   └── styles/              shared styling
└── package.json             frontend scripts and dependencies
```

### Important Frontend Areas

1. `src/App.js`: application routes, including public policy routes.
2. `src/pages/PrivacyPolicy.js`: privacy route now backed by shared markdown rendering.
3. `src/pages/LegalCompliance.js`: public overview of governance and legal materials.
4. `src/pages/PolicyDocumentPage.js`: generic markdown-backed policy renderer.
5. `src/components/PolicyLinks.js`: reusable policy navigation group.
6. `src/utils/policyDocuments.js`: canonical frontend policy metadata.

## Policy Content Flow

The policy pages now follow this source path:

1. Root repository markdown documents remain the source of truth.
2. `scripts/syncPoliciesToFrontend.js` copies them into `frontend/public/policies/`.
3. Frontend routes fetch and render those synced markdown files.

This removes the earlier duplication risk between repository policy documents and the public React pages.

## Runtime Relationships

```text
Browser
  -> React frontend
  -> Express API
  -> PostgreSQL
  -> Redis
```

## Current Environment Shape

```env
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace_with_a_long_random_secret
NODE_ENV=development
```

## Notes

1. Historical MongoDB-oriented descriptions in older docs should be treated as legacy.
2. The active database story is PostgreSQL plus Sequelize, with Redis as supporting infrastructure.
3. The backend includes an RLS-aware request context so PostgreSQL policies can apply on the same connection used by application queries.
```

**Frontend:**
```bash
cd frontend
npm run build  # Creates optimized build
# Serve the build folder with a web server
```

## 📊 Database Schema

### Users Collection
- firstName, lastName, email, password
- role (7 types)
- phoneNumber, state, court
- isActive, lastLogin
- timestamps

### Cases Collection
- caseNumber (auto-generated)
- title, caseType, courtType, state
- plaintiff, defendant (with lawyers)
- assignedJudge (ref to Judge)
- hearingDates array
- status, priority
- filingFee object
- documents array
- notes
- timestamps

### Judges Collection
- firstName, lastName, title
- email, phoneNumber
- courtType, state
- specialization array
- maxDailyCases, currentCaseLoad
- totalCasesHandled
- availability array
- isActive
- appointmentDate, retirementDate
- timestamps

### Payments Collection
- paymentType, amount, currency
- status, dueDate, paymentDate
- paymentMethod
- receiptNumber, transactionReference
- relatedCase (ref to Case)
- state, courtType
- payer object
- isRecurring, recurringFrequency
- timestamps

## 🎨 Styling

### CSS Framework
- Bootstrap 5.3.1
- Bootstrap Icons 1.10.5
- Custom CSS in `index.css`

### Color Scheme
- Primary: #0d6efd (Blue)
- Success: #198754 (Green)
- Warning: #ffc107 (Yellow)
- Danger: #dc3545 (Red)
- Info: #0dcaf0 (Cyan)

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Print-friendly layouts

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Rate limiting
- Helmet security headers
- CORS protection
- Input validation
- XSS protection

## 📱 Offline Capabilities

- PouchDB for local storage
- Automatic sync when online
- Queue management
- Conflict resolution
- Sync status indicators

## 🧪 Testing

Run tests:
```bash
cd backend
npm test
```

## 📝 API Documentation

All API endpoints follow RESTful conventions:
- GET - Retrieve data
- POST - Create new data
- PUT - Update existing data
- DELETE - Remove data

Authentication required for all endpoints except:
- POST /api/auth/login
- POST /api/auth/register

## 🌍 Internationalization

Currently supports:
- English language
- Nigerian Naira (₦) currency
- Nigerian date formats
- Nigerian states and courts

## 📈 Performance

- Indexed database queries
- Pagination for large datasets
- Lazy loading
- Code splitting
- Compression
- Caching strategies

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Maintained by**: Nigerian Bar Association
