# Mini Job Queue Dashboard

A production-quality job queue management system built with React and NestJS, featuring concurrency-safe status transitions, comprehensive validation, and a clean, modern interface.

## 🚀 Live Demo

**Frontend Dashboard:**  
🔗 [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/job-queue-dashboard&root-directory=frontend&env=VITE_API_URL&envDescription=Backend%20API%20URL&project-name=job-queue-dashboard)

**Backend API:**  
🔗 Deploy to Render (see [RENDER_VERCEL_DEPLOYMENT.md](RENDER_VERCEL_DEPLOYMENT.md))

**GitHub Repository:**  
🔗 `https://github.com/YOUR_USERNAME/job-queue-dashboard`

> **Note:** Replace `YOUR_USERNAME` with your GitHub username after pushing to GitHub.  
> See [RENDER_VERCEL_DEPLOYMENT.md](RENDER_VERCEL_DEPLOYMENT.md) for complete deployment instructions.

---

## Overview

This full-stack application allows users to create, manage, and monitor jobs through their lifecycle. The system enforces strict state transitions at the database level and handles concurrent modifications safely.

## Architecture

```
React Frontend (Port 5173)
         ↓
    HTTP/REST API
         ↓
NestJS Backend (Port 3000)
         ↓
    Prisma ORM
         ↓
  PostgreSQL Database
```

### Key Design Decisions

1. **Separate Frontend/Backend**: Independent deployment, clear separation of concerns
2. **Prisma ORM**: Type-safe database access with migrations
3. **Atomic Updates**: Database-level concurrency control
4. **Validation Pipeline**: NestJS ValidationPipe with DTOs
5. **Simple State Management**: React hooks without Redux
6. **PostgreSQL**: Production-grade relational database

## Features

✅ **Core Functionality**
- Create jobs with title and type
- View all jobs sorted by creation time
- Filter jobs by status (pending, running, completed, failed)
- Update job status with validation
- Delete jobs with confirmation
- Real-time status counts

✅ **Production Ready**
- Concurrency-safe status updates
- Comprehensive input validation
- Proper error handling and HTTP status codes
- Health check endpoint
- Environment-based configuration
- TypeScript throughout
- Extensive test coverage

✅ **User Experience**
- Loading states for all operations
- Error messages with auto-refresh
- Confirmation dialogs for destructive actions
- Responsive design
- Relative timestamps

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** - Fast build tool
- **Axios** - HTTP client
- **CSS** - Simple, clean styling

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Strict type checking
- **Prisma** - Modern ORM
- **class-validator** - DTO validation
- **class-transformer** - Object transformation
- **Jest** - Testing framework

### Database
- **PostgreSQL** - Production database

## API Documentation

### Endpoints

#### Create Job
```http
POST /jobs
Content-Type: application/json

{
  "title": "Generate monthly report",
  "type": "report"
}

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Generate monthly report",
  "type": "report",
  "status": "pending",
  "createdAt": "2026-09-15T10:30:00.000Z"
}
```

#### Get All Jobs
```http
GET /jobs

Response: 200 OK
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Generate monthly report",
    "type": "report",
    "status": "pending",
    "createdAt": "2026-09-15T10:30:00.000Z"
  }
]
```

#### Update Job Status
```http
PATCH /jobs/:id/status
Content-Type: application/json

{
  "status": "running"
}

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Generate monthly report",
  "type": "report",
  "status": "running",
  "createdAt": "2026-09-15T10:30:00.000Z"
}

Error Response: 400 Bad Request
{
  "statusCode": 400,
  "message": "Invalid status transition from completed to running",
  "error": "Bad Request"
}

Error Response: 409 Conflict
{
  "statusCode": 409,
  "message": "Job status has been modified by another request. Please refresh and try again.",
  "error": "Conflict"
}
```

#### Delete Job
```http
DELETE /jobs/:id

Response: 204 No Content

Error Response: 404 Not Found
{
  "statusCode": 404,
  "message": "Job with ID <id> not found",
  "error": "Not Found"
}
```

#### Health Check
```http
GET /health

Response: 200 OK
{
  "status": "ok",
  "timestamp": "2026-09-15T10:30:00.000Z"
}
```

## Job State Machine

The system enforces strict state transitions:

```
┌─────────┐
│ pending │
└────┬────┘
     │
     ├──────────────┐
     │              │
     ▼              ▼
┌─────────┐    ┌────────┐
│ running │    │ failed │
└────┬────┘    └────────┘
     │              ▲
     ├──────────────┘
     │
     ▼
┌───────────┐
│ completed │
└───────────┘
```

### Valid Transitions

| From | To | Description |
|------|-----|-------------|
| `pending` | `running` | Start job execution |
| `pending` | `failed` | Job failed before starting |
| `running` | `completed` | Job finished successfully |
| `running` | `failed` | Job encountered an error |

### Invalid Transitions (Rejected with 400)

- `pending` → `completed` (must go through running)
- `completed` → any status (terminal state)
- `failed` → any status (terminal state)
- Any self-transition that doesn't change state

**Why enforce this at the backend?**

Clients can bypass frontend validation by calling the API directly. The backend is the authoritative source of truth and must validate all business rules.

## Concurrency Handling

### The Problem

Race conditions can occur when multiple clients try to update the same job simultaneously:

```
Time    Tab A                    Tab B                    Database
----    ----                     ----                     --------
T0      Read: Job 1 = pending    Read: Job 1 = pending    status = pending
T1      User clicks "Run"        User clicks "Run"        status = pending
T2      PATCH /jobs/1/status     PATCH /jobs/1/status     ???
        {status: "running"}      {status: "running"}
```

**Without protection**, both requests could succeed, potentially causing:
- Duplicate work execution
- Inconsistent state
- Lost updates

### The Solution: Atomic Database Updates

We use **conditional updates** with Prisma's `updateMany`:

```typescript
const result = await this.prisma.job.updateMany({
  where: {
    id: jobId,
    status: currentStatus, // Only update if status hasn't changed
  },
  data: {
    status: newStatus,
  },
});

if (result.count === 0) {
  throw new ConflictException('Job status was modified by another request');
}
```

### How It Works

1. **Read**: Fetch the current job status
2. **Validate**: Check if the transition is valid (e.g., `pending` → `running`)
3. **Atomic Update**: Execute a single SQL statement:
   ```sql
   UPDATE jobs
   SET status = 'running'
   WHERE id = '...' AND status = 'pending';
   ```
4. **Check Result**: 
   - If `count = 1`: Update succeeded
   - If `count = 0`: Status changed (conflict) or job deleted

### Why This Is Safe

- **Atomicity**: The database executes the WHERE condition and UPDATE as a single atomic operation
- **No Race Condition**: Only ONE request can successfully update from a given status
- **Optimistic Locking**: No locks held; just check-and-set in one operation
- **Scalability**: Works across multiple backend instances
- **Clear Errors**: Losing request gets 409 Conflict, can refresh and retry

### Comparison with Alternatives

| Approach | Pros | Cons |
|----------|------|------|
| **Atomic WHERE clause** ✅ | Simple, scalable, no locks | Requires retry on conflict |
| Read + Update (vulnerable) | Simple | Race conditions possible |
| SELECT FOR UPDATE | Guaranteed exclusive access | Holds locks, lower throughput |
| Version column | Explicit versioning | Client must track versions |

We chose atomic updates for simplicity and scalability.

### Test Coverage

The test suite includes a specific concurrency test that:
1. Creates a job in `pending` status
2. Fires two simultaneous `pending` → `running` requests
3. Verifies exactly one succeeds
4. Verifies the other fails with a conflict error
5. Confirms final state is `running` (not corrupted)

## Validation

### Backend Validation

NestJS ValidationPipe with strict configuration:

```typescript
new ValidationPipe({
  whitelist: true,              // Strip unknown properties
  forbidNonWhitelisted: true,   // Reject unknown properties
  transform: true,              // Auto-transform to DTO types
})
```

### DTO Validation

**CreateJobDto:**
```typescript
class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}
```

**UpdateJobStatusDto:**
```typescript
class UpdateJobStatusDto {
  @IsEnum(JobStatus)
  status: JobStatus;
}
```

### Validation Errors

Invalid requests return 400 Bad Request:

```json
{
  "statusCode": 400,
  "message": ["title should not be empty", "title must be a string"],
  "error": "Bad Request"
}
```

## Error Handling

The API uses semantic HTTP status codes:

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET/PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, invalid transition |
| 404 | Not Found | Job doesn't exist |
| 409 | Conflict | Concurrent modification detected |
| 500 | Internal Server Error | Unexpected error (logged) |

**Error Response Format:**
```json
{
  "statusCode": 400,
  "message": "Invalid status transition from completed to running",
  "error": "Bad Request"
}
```

Database internals and stack traces are never exposed to clients.

## Local Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mini-job-queue-dashboard
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   
   # Configure environment
   cp .env.example .env
   # Edit .env and set your DATABASE_URL
   
   # Run migrations
   npm run prisma:migrate
   
   # Generate Prisma client
   npm run prisma:generate
   
   # Optional: Seed sample data
   npm run prisma:seed
   
   # Start backend (NOT "npm run dev" - use "start:dev")
   npm run start:dev
   ```

   Backend will run at `http://localhost:3000`

3. **Setup Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   
   # Configure environment
   cp .env.example .env
   # Default VITE_API_URL=http://localhost:3000 should work
   
   # Start frontend
   npm run dev
   ```

   Frontend will run at `http://localhost:5173`

4. **Open the application**
   
   Navigate to `http://localhost:5173` in your browser

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/job_queue_db?schema=public"
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3000
```

## Testing

### Backend Tests

Run all tests:
```bash
cd backend
npm test
```

Run tests with coverage:
```bash
npm run test:cov
```

Run specific test file:
```bash
npm test jobs.service.spec.ts
```

### Test Coverage

The test suite covers:
- ✅ Job creation with default status
- ✅ Fetching all jobs
- ✅ All valid status transitions (4 cases)
- ✅ All invalid status transitions (8 cases)
- ✅ Non-existent job handling
- ✅ **Concurrent status update safety**
- ✅ Job deletion

**Critical Test: Concurrency Safety**

```typescript
it('should handle concurrent status updates safely', async () => {
  const job = await service.create({ title: 'Test Job', type: 'test' });

  // Simulate two simultaneous pending -> running requests
  const update1 = service.updateStatus(job.id, { status: JobStatus.RUNNING });
  const update2 = service.updateStatus(job.id, { status: JobStatus.RUNNING });

  const results = await Promise.allSettled([update1, update2]);

  // Exactly one should succeed
  expect(succeeded.length).toBe(1);
  expect(failed.length).toBe(1);

  // Final state should be RUNNING (not corrupted)
  const finalJob = await service.findAll();
  const updatedJob = finalJob.find((j) => j.id === job.id);
  expect(updatedJob?.status).toBe(JobStatus.RUNNING);
});
```

This test proves the concurrency mechanism works correctly.

## Production Deployment

### Database

1. Provision PostgreSQL:
   - AWS RDS
   - Digital Ocean Managed Databases
   - Heroku Postgres
   - Supabase

2. Set `DATABASE_URL` environment variable

3. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

### Backend Deployment

**Platforms:**
- **Heroku**: Add Node.js buildpack, PostgreSQL addon
- **AWS**: ECS/Elastic Beanstalk with RDS
- **Digital Ocean**: App Platform with managed PostgreSQL
- **Render**: Web service with PostgreSQL database

**Required Environment Variables:**
- `DATABASE_URL`
- `PORT` (usually provided by platform)
- `CORS_ORIGIN` (your frontend URL)

**Build and Start:**
```bash
npm run build
npm run start:prod
```

### Frontend Deployment

**Platforms:**
- **Vercel** (recommended for Vite/React)
- **Netlify**
- **Cloudflare Pages**
- **AWS S3 + CloudFront**

**Build:**
```bash
npm run build
```

Output directory: `dist/`

**Required Environment Variable:**
- `VITE_API_URL` (your backend URL)

**Important**: Set environment variables BEFORE building, as Vite embeds them at build time.

### Docker Deployment

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

## Production Improvements

### Health Check Endpoint

The `/health` endpoint is critical for:
- **Load Balancer Health Checks**: AWS ALB, Google Cloud Load Balancer
- **Container Orchestration**: Kubernetes liveness/readiness probes
- **Uptime Monitoring**: Pingdom, UptimeRobot, Datadog
- **Deployment Verification**: Confirm new version is responsive

```bash
curl http://localhost:3000/health
# {"status":"ok","timestamp":"2026-09-15T10:30:00.000Z"}
```

### Request Logging

NestJS logs all requests in development. For production:

1. Add structured logging (Winston, Pino)
2. Send logs to centralized system (CloudWatch, Datadog, Loggly)
3. Include request IDs for tracing
4. Log level configuration via environment

### Future Enhancements

With more time, consider adding:

- **Authentication**: JWT tokens, role-based access
- **Pagination**: Limit large job lists
- **Search**: Filter by title/type
- **Job Priority**: Priority queue implementation
- **Scheduled Jobs**: Cron-like scheduling
- **Job History**: Audit log of status changes
- **Webhooks**: Notify external systems on completion
- **Rate Limiting**: Prevent API abuse
- **Metrics**: Prometheus metrics for monitoring
- **Real-time Updates**: WebSocket for live dashboard

## Assumptions

1. **Single User**: No authentication required
2. **Single Tenant**: All jobs visible to all users
3. **Job Types**: Free-form text (not predefined enum)
4. **No Job Payload**: Jobs don't carry execution data
5. **Immediate Transitions**: No async job processing (real queue)
6. **Local Development**: PostgreSQL accessible on localhost
7. **Modern Browsers**: ES6+ JavaScript support

## Trade-offs

### PostgreSQL vs SQLite

**Choice: PostgreSQL**

| PostgreSQL ✅ | SQLite |
|--------------|--------|
| Production-ready | Development only |
| Concurrent writes | Write serialization |
| Network access | File-based |
| Advanced features | Limited features |

SQLite is fine for local dev, but PostgreSQL is required for production deployment.

### Prisma vs TypeORM

**Choice: Prisma**

| Prisma ✅ | TypeORM |
|----------|---------|
| Type-safe client | Decorator-based |
| Excellent migrations | Migration management |
| Modern API | Mature, established |
| Great DX | More verbose |

Prisma's type safety and DX made it the clear choice.

### Redux vs React Hooks

**Choice: React Hooks**

| React Hooks ✅ | Redux |
|----------------|-------|
| Built-in | External dependency |
| Simple for this scale | Better for large apps |
| Less boilerplate | More boilerplate |
| Sufficient | Overkill for this app |

Redux would be justified for:
- Large app with many features
- Complex shared state
- Time-travel debugging needs

For this app, React hooks are simpler and sufficient.

### Atomic Updates vs Pessimistic Locking

**Choice: Atomic WHERE Clause Updates**

| Atomic Updates ✅ | SELECT FOR UPDATE |
|-------------------|-------------------|
| No locks held | Holds row locks |
| High throughput | Lower throughput |
| Optimistic | Pessimistic |
| Retry on conflict | Guaranteed success |

For this use case (infrequent conflicts), optimistic locking with atomic updates is more scalable.

## Assignment Requirements Checklist

### Core Features
- ✅ POST /jobs endpoint
- ✅ GET /jobs endpoint
- ✅ PATCH /jobs/:id/status endpoint
- ✅ DELETE /jobs/:id endpoint
- ✅ Job model with id, title, type, status, createdAt
- ✅ Status enum (pending, running, completed, failed)
- ✅ Database persistence
- ✅ UUID for job IDs
- ✅ Automatic createdAt timestamp

### Validation
- ✅ Title required and non-empty
- ✅ Type required and non-empty
- ✅ Status must be valid enum value
- ✅ Unknown fields rejected
- ✅ ValidationPipe with whitelist
- ✅ DTO validation with decorators

### Status Transitions
- ✅ Valid: pending → running
- ✅ Valid: pending → failed
- ✅ Valid: running → completed
- ✅ Valid: running → failed
- ✅ Invalid: pending → completed (rejected)
- ✅ Invalid: completed → running (rejected)
- ✅ Invalid: completed → pending (rejected)
- ✅ Invalid: completed → failed (rejected)
- ✅ Invalid: failed → running (rejected)
- ✅ Invalid: failed → pending (rejected)
- ✅ Invalid: failed → completed (rejected)
- ✅ Backend enforces transitions (not just frontend)

### Concurrency Safety
- ✅ Atomic database updates
- ✅ Conditional WHERE clause prevents race conditions
- ✅ Only one concurrent request succeeds
- ✅ Conflict detection returns 409
- ✅ Test coverage for concurrent updates
- ✅ Clear documentation of approach

### Error Handling
- ✅ 200 OK for successful GET/PATCH
- ✅ 201 Created for successful POST
- ✅ 204 No Content for successful DELETE
- ✅ 400 Bad Request for validation/transition errors
- ✅ 404 Not Found for missing jobs
- ✅ 409 Conflict for concurrent modifications
- ✅ Clear error messages
- ✅ No database internals exposed

### Backend Architecture
- ✅ Clean controller/service/repository separation
- ✅ Business logic in service layer
- ✅ HTTP concerns in controller
- ✅ DTOs for validation
- ✅ Proper module organization

### Frontend Features
- ✅ Display all jobs
- ✅ Filter by status
- ✅ Create new jobs
- ✅ Update job status
- ✅ Delete jobs
- ✅ Status counts display
- ✅ Loading states
- ✅ Error handling
- ✅ Empty state
- ✅ Delete confirmation
- ✅ Form validation
- ✅ Disable buttons during operations

### Frontend Architecture
- ✅ Separate API service layer
- ✅ Custom hooks for state management
- ✅ No Redux (justified)
- ✅ Clean component structure
- ✅ TypeScript types

### Testing
- ✅ Job creation test
- ✅ Get jobs test
- ✅ Valid transition tests (4 cases)
- ✅ Invalid transition tests (8 cases)
- ✅ Non-existent job test
- ✅ Concurrency safety test
- ✅ Delete job tests

### Configuration
- ✅ Environment variables
- ✅ .env.example files
- ✅ CORS configuration
- ✅ No secrets in code

### Documentation
- ✅ Comprehensive README
- ✅ API documentation with examples
- ✅ State machine diagram
- ✅ Concurrency explanation
- ✅ Setup instructions
- ✅ Testing instructions
- ✅ Deployment guide
- ✅ Architecture diagram
- ✅ Trade-offs explained
- ✅ Assumptions documented

### Bonus
- ✅ Health check endpoint (/health)
- ✅ Explanation of production benefits

## What to Submit

1. **GitHub Repository** containing:
   - `backend/` - NestJS API
   - `frontend/` - React app
   - `README.md` - This file
   - `.gitignore` - Excludes node_modules, .env, dist

2. **Documentation**:
   - API endpoint examples
   - Setup instructions
   - Testing instructions
   - Concurrency explanation

3. **Running Application**:
   - Instructions to run locally
   - Both services start successfully
   - All features work end-to-end

## License

MIT

---

**Built with ❤️ for the React + NestJS Internship Assignment**
