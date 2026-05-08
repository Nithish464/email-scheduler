# MailQueue — Full-Stack Email Job Scheduler

> Production-grade email scheduling system built with BullMQ + Redis + PostgreSQL + Next.js

---

## Tech Stack

| Layer       | Technology                              |
|-------------|----------------------------------------|
| Backend     | Express.js + TypeScript                |
| Queue       | BullMQ (Redis-backed)                  |
| Database    | PostgreSQL + Prisma ORM                |
| SMTP        | Ethereal Email (via Nodemailer)        |
| Frontend    | Next.js 14 + Tailwind CSS + TypeScript |
| Auth        | Google OAuth 2.0 + Passport.js         |
| Session     | Redis-backed express-session           |
| Infra       | Docker (Redis + PostgreSQL)            |

---

## Quick Start

### 1. Start Infrastructure (Docker)

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 and Redis on port 6379.

---

### 2. Backend Setup

```bash
cd backend
npm install

# Copy and fill in your env vars
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/email_scheduler
REDIS_HOST=localhost
REDIS_PORT=6379

# Google OAuth — https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

SESSION_SECRET=change_this_to_random_string
FRONTEND_URL=http://localhost:3000

# Optional: auto-generated on first run if blank
ETHEREAL_USER=
ETHEREAL_PASS=

# Worker config
WORKER_CONCURRENCY=5
MAX_EMAILS_PER_HOUR=200
MIN_DELAY_BETWEEN_EMAILS=2000
```

```bash
# Run database migrations
npx prisma migrate dev --name init
npx prisma generate

# Start API server
npm run dev

# In a separate terminal — start BullMQ worker
npm run worker
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create env file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Start dev server
npm run dev
```

Open http://localhost:3000

---

### 4. Google OAuth Setup

1. Go to https://console.cloud.google.com/
2. Create a new project → Enable "Google+ API"
3. Go to Credentials → Create OAuth 2.0 Client ID
4. Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
5. Copy Client ID and Client Secret into `backend/.env`

---

### 5. Ethereal Email Setup

Ethereal is auto-configured on first run — the worker will print credentials to console:

```
✅ Auto-created Ethereal account: xxxxx@ethereal.email
   Add to .env: ETHEREAL_USER=xxxxx@ethereal.email
   Add to .env: ETHEREAL_PASS=xxxxxxxx
```

Copy these into `.env` to persist them across restarts.

Preview sent emails at: https://ethereal.email/messages

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│               Next.js Frontend                  │
│    Login → Dashboard → Compose → Tables         │
└──────────────────┬──────────────────────────────┘
                   │ REST API (axios + cookies)
┌──────────────────▼──────────────────────────────┐
│            Express.js Backend                   │
│   /auth/* (Google OAuth + session)              │
│   /emails/* (schedule, list)                    │
└──────┬──────────────────────┬───────────────────┘
       │                      │
  ┌────▼─────┐          ┌─────▼──────┐
  │ BullMQ   │          │ PostgreSQL  │
  │ Queue    │          │  (Prisma)   │
  │ (Redis)  │          └────────────┘
  └────┬─────┘
       │ processes jobs
  ┌────▼─────────────────────────────────────────┐
  │              BullMQ Worker                   │
  │  - concurrency: WORKER_CONCURRENCY           │
  │  - rate limit: Redis counter per sender/hour │
  │  - throttle: MIN_DELAY_BETWEEN_EMAILS        │
  │  - idempotency: unique bullJobId             │
  └────┬─────────────────────────────────────────┘
       │
  ┌────▼─────┐
  │ Ethereal │
  │  SMTP    │
  └──────────┘
```

---

## Scheduling & Persistence

### How Scheduling Works

1. Client sends `POST /emails/schedule` or `POST /emails/schedule/bulk`
2. Backend creates `EmailJob` record in PostgreSQL with status `SCHEDULED`
3. Backend calls `emailQueue.add('send-email', payload, { delay: msUntilSend })`
4. BullMQ stores the delayed job in **Redis** (persistent)
5. When the delay expires, BullMQ delivers the job to the Worker
6. Worker sends the email via Ethereal SMTP
7. Worker updates DB record to `SENT` with `sentTime`

### Restart Recovery

**Normal case:** BullMQ stores all delayed jobs in Redis. If the server restarts but Redis is intact, jobs continue processing automatically — no code needed.

**Edge case (Redis wiped):** On every server startup, `recoverJobsOnStartup()` runs:
- Queries all `SCHEDULED`/`QUEUED` jobs from PostgreSQL with `scheduledTime > now`
- Checks if each job exists in BullMQ (by `bullJobId`)
- Re-enqueues any missing jobs with correct remaining delay

This guarantees **no email is lost** even if Redis is completely wiped.

### Idempotency

Each BullMQ job is created with a deterministic ID: `email-{dbJobId}`. BullMQ prevents duplicate job IDs, so even if the API is called twice with the same data, only one job is enqueued. The worker also checks DB status before sending:

```typescript
if (emailJob.status === 'SENT') {
  console.log('Already sent, skipping');
  return;
}
```

---

## Rate Limiting Strategy

### Hourly Limit (Redis counter)

```
Key format: ratelimit:{senderId}:{YYYY-MM-DDTHH}
TTL: 7200s (auto-cleanup)
```

Before sending each email, the worker:
1. Calls `INCR ratelimit:{senderId}:{hour}` atomically in Redis
2. If count > `MAX_EMAILS_PER_HOUR`:
   - Decrements counter (we're not actually sending)
   - Calculates ms until next hour starts
   - Re-enqueues job with that delay
   - **Job is never dropped — only rescheduled**

This counter is Redis-backed and safe across multiple worker instances.

### Minimum Delay Between Emails

After rate limit check passes, the worker calls `sleep(MIN_DELAY_BETWEEN_EMAILS)` before sending. This ensures at minimum `MIN_DELAY_BETWEEN_EMAILS` ms between consecutive sends from a worker instance.

### Concurrency

`WORKER_CONCURRENCY=5` means 5 emails can be processed in parallel. Combined with the min delay, actual throughput is approximately:

```
max_per_second = WORKER_CONCURRENCY / (MIN_DELAY_BETWEEN_EMAILS / 1000)
             = 5 / 2 = 2.5 emails/second
             = 9000 emails/hour per worker instance
```

(Subject to `MAX_EMAILS_PER_HOUR` cap)

### Bulk Scheduling (1000+ emails)

When bulk scheduling respects `hourlyLimit`, the service pre-calculates scheduling times:
- Emails 1–N within hourly limit get consecutive `startTime + (i * delay)` timestamps
- When limit is hit, next email starts at the next hour boundary
- Order is preserved

---

## API Reference

### Auth

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | /auth/google          | Initiate Google OAuth    |
| GET    | /auth/google/callback | OAuth callback           |
| GET    | /auth/me              | Get current user         |
| POST   | /auth/logout          | Logout                   |

### Emails (requires auth)

| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| POST   | /emails/schedule        | Schedule single email    |
| POST   | /emails/schedule/bulk   | Schedule bulk emails     |
| GET    | /emails/scheduled       | List scheduled emails    |
| GET    | /emails/sent            | List sent/failed emails  |
| GET    | /emails/:id             | Get single email job     |

### Bulk schedule payload

```json
{
  "recipients": ["a@x.com", "b@x.com"],
  "subject": "Hello",
  "body": "<p>Email content</p>",
  "startTime": "2024-01-15T10:00:00.000Z",
  "delayBetweenEmails": 2000,
  "hourlyLimit": 200
}
```

---

## Features Implemented

### Backend
- [x] Google OAuth with Passport.js
- [x] Redis-backed session (persistent across restarts)
- [x] BullMQ delayed job scheduling (no cron)
- [x] PostgreSQL persistence via Prisma
- [x] BullMQ Worker with configurable concurrency
- [x] Redis-backed hourly rate limiting (per sender)
- [x] Min delay between email sends
- [x] Restart recovery (re-enqueue from DB)
- [x] Idempotency (unique job IDs + DB status check)
- [x] Ethereal SMTP integration
- [x] Bulk scheduling with hour-boundary overflow
- [x] Job rescheduling when rate limited (no drops)

### Frontend
- [x] Google OAuth login page
- [x] Dashboard with user name, email, avatar
- [x] Logout
- [x] Compose modal (single + bulk mode)
- [x] CSV/TXT upload with parsing
- [x] Email count display after parse
- [x] Scheduling options (start time, delay, hourly limit)
- [x] Scheduled emails table with status badges
- [x] Sent emails table with sent time
- [x] Live polling (10s refresh)
- [x] Loading states (shimmer skeleton)
- [x] Empty states
- [x] Error handling with toasts
- [x] Stats bar (scheduled/sent/failed counts)
- [x] Responsive design

---

## Environment Variables

| Variable                  | Default               | Description                        |
|---------------------------|-----------------------|------------------------------------|
| PORT                      | 5000                  | Backend port                       |
| DATABASE_URL              | —                     | PostgreSQL connection string       |
| REDIS_HOST                | localhost             | Redis host                         |
| REDIS_PORT                | 6379                  | Redis port                         |
| GOOGLE_CLIENT_ID          | —                     | Google OAuth client ID             |
| GOOGLE_CLIENT_SECRET      | —                     | Google OAuth client secret         |
| GOOGLE_CALLBACK_URL       | —                     | OAuth callback URL                 |
| SESSION_SECRET            | —                     | Express session secret             |
| FRONTEND_URL              | http://localhost:3000 | CORS + OAuth redirect              |
| ETHEREAL_USER             | (auto-generated)      | Ethereal SMTP username             |
| ETHEREAL_PASS             | (auto-generated)      | Ethereal SMTP password             |
| WORKER_CONCURRENCY        | 5                     | BullMQ worker concurrency          |
| MAX_EMAILS_PER_HOUR       | 200                   | Hourly rate limit per sender       |
| MIN_DELAY_BETWEEN_EMAILS  | 2000                  | Min ms between sends               |

---

## Trade-offs & Assumptions

- **Ethereal SMTP** is used for testing — no real emails are sent. Swap the transporter in `emailService.ts` for production (SendGrid, SES, etc.)
- **Sessions are stored in Redis** — if Redis is fully wiped, users will need to re-login
- **Rate limiting is per-sender** (by user ID) — not per SMTP provider account
- **The worker and server run as separate processes** — in production, you'd deploy them independently and scale workers horizontally
- **Polling** (10s interval) is used instead of WebSockets for simplicity — upgrade to Socket.io for real-time updates

# MailQueue — Full-Stack Email Job Scheduler

> Production-grade email scheduling system built with BullMQ + Redis + PostgreSQL + Next.js

## 🚀 Live Demo

**Hosted URL:** https://email-scheduler-production-ccb0.up.railway.app

**GitHub Repo:** https://github.com/Nithish464/email-scheduler

---