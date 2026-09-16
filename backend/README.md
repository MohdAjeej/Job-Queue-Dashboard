# Job Queue Backend

NestJS backend API for the Job Queue Management Dashboard.

## Features

- RESTful API for job management
- PostgreSQL database with Prisma ORM
- Strict validation with class-validator
- Concurrency-safe status updates
- Comprehensive test suite
- Health check endpoint

## Tech Stack

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Prisma** - Modern ORM with type safety
- **PostgreSQL** - Production-grade database
- **class-validator** - DTO validation
- **Jest** - Testing framework

## API Endpoints

### Create Job
```
POST /jobs
Content-Type: application/json

{
  "title": "Generate monthly report",
  "type": "report"
}

Response: 201 Created
{
  "id": "uuid",
  "title": "Generate monthly report",
  "type": "report",
  "status": "pending",
  "createdAt": "2026-09-15T..."
}
```

### Get All Jobs
```
GET /jobs

Response: 200 OK
[
  {
    "id": "uuid",
    "title": "Generate monthly report",
    "type": "report",
    "status": "pending",
    "createdAt": "2026-09-15T..."
  }
]
```

### Update Job Status
```
PATCH /jobs/:id/status
Content-Type: application/json

{
  "status": "running"
}

Response: 200 OK
{
  "id": "uuid",
  "title": "Generate monthly report",
  "type": "report",
  "status": "running",
  "createdAt": "2026-09-15T..."
}
```

### Delete Job
```
DELETE /jobs/:id

Response: 204 No Content
```

### Health Check
```
GET /health

Response: 200 OK
{
  "status": "ok",
  "timestamp": "2026-09-15T..."
}
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

Edit `.env` and set your database connection:
```
DATABASE_URL="postgresql://user:password@localhost:5432/job_queue_db?schema=public"
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

3. Run database migrations:
```bash
npm run prisma:migrate
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. (Optional) Seed database with sample data:
```bash
npm run prisma:seed
```

### Running the Application

Development mode with hot reload:
```bash
npm run start:dev
```

Production mode:
```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:cov
```

## Architecture

```
Controller Layer (HTTP concerns)
    ↓
Service Layer (Business logic)
    ↓
Prisma Client (Database operations)
    ↓
PostgreSQL Database
```

### Project Structure

```
src/
├── jobs/
│   ├── dto/
│   │   ├── create-job.dto.ts      # Validation for job creation
│   │   └── update-job-status.dto.ts # Validation for status updates
│   ├── entities/
│   │   └── job.entity.ts          # Job types and enums
│   ├── jobs.controller.ts         # HTTP endpoints
│   ├── jobs.service.ts            # Business logic
│   ├── jobs.service.spec.ts       # Unit tests
│   └── jobs.module.ts             # Module definition
├── health/
│   ├── health.controller.ts       # Health check endpoint
│   └── health.module.ts
├── app.module.ts                  # Root module
└── main.ts                        # Application entry point
```

## Job State Machine

The backend enforces strict state transitions:

```
pending
  ├──> running
  │      ├──> completed
  │      └──> failed
  └──> failed
```

### Valid Transitions

- `pending` → `running`
- `pending` → `failed`
- `running` → `completed`
- `running` → `failed`

### Invalid Transitions (Rejected)

- `pending` → `completed`
- `completed` → any other status
- `failed` → any other status

The backend returns `400 Bad Request` for invalid transitions.

## Concurrency Handling

### The Problem

Consider this race condition:

1. Two browser tabs both display Job A with status `pending`
2. Both tabs simultaneously send: `PATCH /jobs/A/status` with `{"status": "running"}`
3. Without protection, both could succeed, causing inconsistent state

### The Solution

We use **atomic database updates** with conditional WHERE clauses:

```typescript
await this.prisma.job.updateMany({
  where: {
    id: jobId,
    status: currentStatus, // Only update if status hasn't changed
  },
  data: {
    status: newStatus,
  },
});
```

### How It Works

1. When a status update request arrives, we first read the current status
2. We validate the transition (e.g., `pending` → `running` is valid)
3. We execute an atomic UPDATE that includes the current status in the WHERE clause
4. The database checks:
   - Does the job exist with this ID?
   - Does it currently have the expected status?
5. If both conditions are met, the update succeeds (count = 1)
6. If another request already changed the status, the update fails (count = 0)
7. When count = 0, we return `409 Conflict`

### Why This Is Safe

- The database operation is **atomic** - it's a single operation, not read-then-write
- Only ONE concurrent request can successfully update from a given status
- The WHERE clause acts as an optimistic lock
- No explicit row-level locking needed for this use case
- The losing request gets a clear error and can refresh the UI

### Alternative Approaches Considered

- **Pessimistic locking**: `SELECT FOR UPDATE` - heavier, holds locks longer
- **Version fields**: Adds complexity, requires client to track versions
- **Application-level locking**: Doesn't work across multiple server instances

Our approach is lightweight, works across distributed instances, and provides clear error feedback.

## Validation

The backend uses NestJS ValidationPipe with:

- `whitelist: true` - Strips unknown properties
- `forbidNonWhitelisted: true` - Rejects requests with unknown properties
- `transform: true` - Auto-transforms to DTO types

DTOs use class-validator decorators:

```typescript
export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}
```

Invalid requests return `400 Bad Request` with detailed error messages.

## Error Handling

The API uses proper HTTP status codes:

- `200 OK` - Successful GET/PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation errors, invalid transitions
- `404 Not Found` - Job doesn't exist
- `409 Conflict` - Concurrent modification detected
- `500 Internal Server Error` - Unexpected errors (logged, not exposed)

Error responses are JSON:
```json
{
  "statusCode": 400,
  "message": "Invalid status transition from completed to running",
  "error": "Bad Request"
}
```

## Production Readiness

### Health Check

The `/health` endpoint allows monitoring systems to verify the API is responsive:

```bash
curl http://localhost:3000/health
```

This is essential for:
- Load balancer health checks
- Container orchestration (Docker, Kubernetes)
- Uptime monitoring
- Deployment verification

### Request Logging

NestJS provides built-in request logging in the console during development.

For production, integrate structured logging (Winston, Pino) and send logs to a centralized system.

### Security

- CORS configured for specific origins
- Input validation on all endpoints
- No database internals exposed in errors
- Environment variables for sensitive config
- Prepared statements via Prisma (SQL injection protection)

## Deployment

### Database

1. Provision PostgreSQL database (AWS RDS, Digital Ocean, etc.)
2. Set `DATABASE_URL` environment variable
3. Run migrations: `npm run prisma:migrate`

### Application

1. Build: `npm run build`
2. Set environment variables:
   - `DATABASE_URL`
   - `PORT`
   - `CORS_ORIGIN` (your frontend URL)
3. Start: `npm run start:prod`

### Platforms

- **Heroku**: Add PostgreSQL addon, set buildpacks
- **AWS**: Deploy to ECS/Elastic Beanstalk with RDS
- **Digital Ocean**: App Platform with managed PostgreSQL
- **Vercel/Netlify**: Not ideal for backend (use dedicated API hosting)

## Environment Variables

Required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - Frontend URL for CORS (default: http://localhost:5173)

## License

MIT
