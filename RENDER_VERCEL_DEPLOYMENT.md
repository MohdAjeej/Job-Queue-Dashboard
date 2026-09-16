# Complete Render + Vercel Deployment Guide

This guide will help you deploy the Job Queue Dashboard to Render (backend) and Vercel (frontend) in ~20 minutes.

---

## Prerequisites

- GitHub account
- Render.com account (free tier available)
- Vercel account (free tier available)
- Code pushed to GitHub

---

## Step 1: Push to GitHub (5 minutes)

### 1.1 Initialize Git

```bash
cd C:\Users\azizp\Downloads\alpha

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Complete Job Queue Dashboard - NestJS + React"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `job-queue-dashboard`
3. **Make it PUBLIC** ✅ (required by assignment)
4. Do NOT initialize with README
5. Click "Create repository"

### 1.3 Push to GitHub

```bash
# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/job-queue-dashboard.git
git branch -M main
git push -u origin main
```

### 1.4 Verify

Go to `https://github.com/YOUR_USERNAME/job-queue-dashboard` and verify all files are there.

✅ **Your GitHub URL**: `https://github.com/YOUR_USERNAME/job-queue-dashboard`

---

## Step 2: Deploy Backend to Render (10 minutes)

### 2.1 Create Render Account

1. Go to https://render.com/
2. Sign up with GitHub
3. Authorize Render to access your repositories

### 2.2 Create PostgreSQL Database

1. In Render Dashboard → Click **"New +"** → Select **"PostgreSQL"**
2. Configure:
   - Name: `job-queue-db`
   - Database: `job_queue_db`
   - User: (auto-generated)
   - Region: Select closest to you
   - Plan: **Free** (for development)
3. Click **"Create Database"**
4. Wait for database to be created (~2 minutes)
5. **Copy the "Internal Database URL"** (looks like `postgresql://user:pass@dpg-xxx.../job_queue_db`)

✅ Save this DATABASE_URL - you'll need it in the next step

### 2.3 Deploy Backend Web Service

1. In Render Dashboard → Click **"New +"** → Select **"Web Service"**
2. Connect your GitHub repository: `job-queue-dashboard`
3. Configure:

**Basic Settings:**
- Name: `job-queue-backend` (or your choice)
- Region: Same as database
- Branch: `main`
- Root Directory: `backend`
- Runtime: `Node`

**Build & Deploy:**
- Build Command:
  ```bash
  npm install && npm run prisma:generate && npm run build
  ```

- Start Command:
  ```bash
  npm run prisma:migrate deploy && npm run start:prod
  ```

**Plan:**
- Select: **Free**

4. Click **"Advanced"** to add Environment Variables

### 2.4 Add Environment Variables

Click **"Add Environment Variable"** for each:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (paste the Internal Database URL from Step 2.2) |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `http://localhost:5173` (will update after frontend deployment) |

5. Click **"Create Web Service"**

6. Wait for deployment (~5-10 minutes for first deploy)

### 2.5 Get Your Backend URL

After successful deployment, you'll see:
```
Your service is live at https://job-queue-backend-xxx.onrender.com
```

✅ **Your Backend URL**: `https://job-queue-backend-xxx.onrender.com`

### 2.6 Test Backend

```bash
# Replace with your actual URL
curl https://job-queue-backend-xxx.onrender.com/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-09-16T..."}
```

```bash
curl https://job-queue-backend-xxx.onrender.com/jobs
```

Expected response:
```json
[]
```

✅ Backend is live!

---

## Step 3: Deploy Frontend to Vercel (5 minutes)

### 3.1 Create Vercel Account

1. Go to https://vercel.com/
2. Sign up with GitHub
3. Authorize Vercel

### 3.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Import your `job-queue-dashboard` repository
3. Click **"Import"**

### 3.3 Configure Project

**Framework Preset:** Vite (should auto-detect)

**Root Directory:** Click **"Edit"** → Enter: `frontend`

**Build & Output Settings:**
- Build Command: `npm run build` (default)
- Output Directory: `dist` (default)
- Install Command: `npm install` (default)

### 3.4 Add Environment Variable

Click **"Environment Variables"** section:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://job-queue-backend-xxx.onrender.com` |

**Important:** Replace with your actual backend URL from Step 2.5 (no trailing slash!)

### 3.5 Deploy

1. Click **"Deploy"**
2. Wait for deployment (~2-3 minutes)
3. Get your frontend URL: `https://job-queue-dashboard-xxx.vercel.app`

✅ **Your Frontend URL**: `https://job-queue-dashboard-xxx.vercel.app`

---

## Step 4: Update Backend CORS (2 minutes)

### 4.1 Update CORS_ORIGIN

1. Go back to **Render Dashboard**
2. Select your `job-queue-backend` service
3. Click **"Environment"** tab
4. Find `CORS_ORIGIN` variable
5. Update the value to:
   ```
   https://job-queue-dashboard-xxx.vercel.app
   ```
   (use your actual Vercel URL, no trailing slash)

6. Click **"Save Changes"**
7. Render will automatically redeploy (~2 minutes)

### 4.2 Test CORS

Open your browser:
1. Go to: `https://job-queue-dashboard-xxx.vercel.app`
2. Open DevTools (F12) → Console tab
3. Check for errors
4. Try creating a job

✅ If no CORS errors appear, you're good!

---

## Step 5: Final Testing (3 minutes)

### 5.1 Test All Features

Open your deployed frontend: `https://job-queue-dashboard-xxx.vercel.app`

Test each feature:
- ✅ Dashboard loads
- ✅ Status cards show (All, Pending, Running, Completed, Failed)
- ✅ **Create a job**
  - Enter title: "Test Job"
  - Enter type: "test"
  - Click "Create Job"
  - Job appears in table
- ✅ **Update status**
  - Click "Run" on pending job
  - Status changes to "running"
  - Click "Complete" on running job
  - Status changes to "completed"
- ✅ **Filter jobs**
  - Click "Completed" status card
  - Only completed jobs show
- ✅ **Delete job**
  - Click "Delete" on any job
  - Confirm deletion
  - Job disappears

### 5.2 Test Concurrency (Advanced)

1. Open TWO browser tabs with your deployed frontend
2. Create a new job (status: pending)
3. In BOTH tabs simultaneously, click "Run"
4. **Expected behavior:**
   - One tab succeeds (status changes to "running")
   - Other tab shows error or refreshes
   - Final state is "running" (not corrupted)

✅ Concurrency safety works!

---

## Step 6: Update README for Submission

Add this section to your `README.md`:

```markdown
## 🚀 Live Demo

**Frontend Dashboard:**  
https://job-queue-dashboard-xxx.vercel.app

**Backend API:**  
https://job-queue-backend-xxx.onrender.com

**GitHub Repository:**  
https://github.com/YOUR_USERNAME/job-queue-dashboard

### API Endpoints

- `GET /health` - Health check
- `GET /jobs` - Get all jobs
- `POST /jobs` - Create a job
- `PATCH /jobs/:id/status` - Update job status
- `DELETE /jobs/:id` - Delete a job

### Test the API

```bash
# Health check
curl https://job-queue-backend-xxx.onrender.com/health

# Get all jobs
curl https://job-queue-backend-xxx.onrender.com/jobs

# Create a job
curl -X POST https://job-queue-backend-xxx.onrender.com/jobs \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Job","type":"test"}'
```

## Deployment Architecture

```
┌─────────────────────────────┐
│         Vercel              │
│   React Frontend (Vite)     │
│   job-queue-dashboard       │
└──────────────┬──────────────┘
               │ HTTPS
               ↓
┌─────────────────────────────┐
│         Render              │
│   NestJS Backend API        │
│   job-queue-backend         │
└──────────────┬──────────────┘
               │
               ↓
┌─────────────────────────────┐
│    PostgreSQL Database      │
│         (Render)            │
└─────────────────────────────┘
```
```

---

## Submission Information

### What to Submit

**1. GitHub Repository:**  
`https://github.com/YOUR_USERNAME/job-queue-dashboard`

**2. Live Frontend URL:**  
`https://job-queue-dashboard-xxx.vercel.app`

**3. Live Backend/API URL:**  
`https://job-queue-backend-xxx.onrender.com`

### Key Points to Mention

**Assumptions:**
- Single-tenant system (no authentication required)
- Job types are free-form strings (not predefined enum)
- Jobs don't carry execution payloads
- No actual background job processing (status management only)
- Modern browser with ES6+ support

**Trade-offs:**
- **PostgreSQL over SQLite:** Production-ready but requires managed service
- **Optimistic locking over pessimistic:** Better scalability, handles conflicts gracefully
- **React Hooks over Redux:** Appropriate for single-domain app, less boilerplate
- **Atomic updates:** Simple, effective for this scale (vs distributed locks)

**Concurrency Solution:**
> Job status transitions are enforced on the backend, not the React client. The API validates the current status before performing any transition, preventing clients from bypassing business rules. For concurrent requests attempting the same transition (e.g., two users trying pending → running), the database update uses a conditional WHERE clause matching the current status. This ensures only ONE request can successfully transition the job from a given state. The losing request receives a 409 Conflict error and must refresh.

**Bonus Feature:**
> Health check endpoint (`GET /health`) enables monitoring systems, load balancers, and deployment tools to verify the API is responsive. Essential for production reliability and automated health checks.

**Additional Improvements (with more time):**
- WebSocket for real-time status updates across all clients
- Pagination for large job lists
- Search and advanced filtering
- Job priority queue
- Automated job retry mechanism
- Audit log tracking all status changes with timestamps
- Rate limiting to prevent API abuse
- E2E tests with Cypress/Playwright
- CI/CD pipeline with GitHub Actions

---

## Troubleshooting

### Backend Issues

**Problem:** "Application failed to start"

**Solution:**
1. Check Render logs (Logs tab)
2. Verify DATABASE_URL is correct
3. Ensure migrations ran: `npm run prisma:migrate deploy`
4. Check Node version compatibility

**Problem:** "Cannot connect to database"

**Solution:**
1. Verify PostgreSQL database is running on Render
2. Check DATABASE_URL format
3. Use "Internal Database URL" not "External"
4. Ensure database and backend are in same region

**Problem:** CORS errors in browser

**Solution:**
1. Verify CORS_ORIGIN in Render environment variables
2. Must match frontend URL exactly (no trailing slash)
3. Wait for Render to redeploy after changing env vars
4. Hard refresh browser (Ctrl+Shift+R)

### Frontend Issues

**Problem:** "Failed to fetch jobs"

**Solution:**
1. Check backend is running: visit `/health` endpoint
2. Verify VITE_API_URL in Vercel environment variables
3. Must be HTTPS URL from Render
4. Redeploy frontend after changing env vars

**Problem:** Blank page or white screen

**Solution:**
1. Check browser console for errors
2. Verify build succeeded in Vercel dashboard
3. Check Vercel function logs
4. Verify root directory is set to `frontend`

**Problem:** Environment variable not working

**Solution:**
1. Environment variables in Vercel are set at BUILD time
2. After adding/changing VITE_API_URL, must REDEPLOY
3. Go to Vercel → Deployments → click "..." → Redeploy

### Render Free Tier Limitations

**Important:** Render free tier services spin down after 15 minutes of inactivity.

**Impact:**
- First request after inactivity will be slow (~30-60 seconds)
- Backend needs to "wake up"
- This is normal for free tier

**Solution for Demo:**
- Visit your backend URL 1-2 minutes before demo/submission
- This "warms up" the service
- Subsequent requests will be fast

---

## Environment Variables Reference

### Backend (Render)

```env
DATABASE_URL=postgresql://user:pass@host/database
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Frontend (Vercel)

```env
VITE_API_URL=https://your-backend.onrender.com
```

**Remember:** No trailing slashes in URLs!

---

## Deployment Checklist

Before submission, verify:

- [ ] Code pushed to public GitHub repository
- [ ] Backend deployed to Render
- [ ] PostgreSQL database created on Render
- [ ] Backend environment variables set correctly
- [ ] Backend health check works (`/health` returns 200)
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variable set (`VITE_API_URL`)
- [ ] CORS updated with frontend URL
- [ ] Frontend loads without errors
- [ ] Can create job via deployed UI
- [ ] Can update job status via deployed UI
- [ ] Can filter jobs via deployed UI
- [ ] Can delete job via deployed UI
- [ ] No CORS errors in browser console
- [ ] README.md updated with live URLs
- [ ] All 3 URLs ready for submission

---

## Success Criteria

✅ **Your deployment is successful when:**

1. Frontend dashboard loads at Vercel URL
2. Backend health check returns OK at Render URL
3. Can perform all CRUD operations via UI
4. Status transitions are enforced
5. No CORS errors in browser console
6. Concurrency safety works (test with two tabs)

---

## Cost: $0

Both Render and Vercel offer generous free tiers:

**Render Free Tier:**
- 750 hours/month of runtime
- PostgreSQL database with 1GB storage
- Spins down after 15min inactivity

**Vercel Free Tier:**
- Unlimited deployments
- 100GB bandwidth/month
- Automatic HTTPS

**Total Monthly Cost:** $0

Perfect for assignment submission and portfolio!

---

## Next Steps After Deployment

1. **Take screenshots** of:
   - Deployed dashboard showing jobs
   - Browser DevTools showing successful API calls
   - Concurrency test (two tabs)

2. **Record a short video** (optional but impressive):
   - Show creating a job
   - Show status transitions
   - Show filtering
   - Show deletion

3. **Update your README** with:
   - Live demo links
   - Architecture diagram
   - Screenshots

4. **Submit** the 3 URLs:
   - GitHub repository
   - Live frontend
   - Live backend

---

## Estimated Timeline

| Task | Time |
|------|------|
| Push to GitHub | 5 min |
| Create Render account + PostgreSQL | 3 min |
| Deploy backend to Render | 10 min |
| Create Vercel account | 2 min |
| Deploy frontend to Vercel | 5 min |
| Update CORS | 2 min |
| Test everything | 3 min |
| **Total** | **~30 minutes** |

---

## Support

If you encounter issues:

1. Check Render logs: Dashboard → Your Service → Logs
2. Check Vercel logs: Dashboard → Your Project → Deployments → View Function Logs
3. Check browser console (F12)
4. Verify environment variables are set correctly
5. Ensure URLs have no trailing slashes

---

**Congratulations on deploying your full-stack application!** 🎉

Your Job Queue Dashboard is now live and ready for submission!
