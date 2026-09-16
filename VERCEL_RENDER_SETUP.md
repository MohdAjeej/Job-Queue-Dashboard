# Vercel + Render Setup Guide

## ✅ Frontend Deployed to Vercel
**URL:** https://job-queue-dashboard-three.vercel.app/

---

## 🔧 Step 1: Add Environment Variable to Vercel

Your frontend needs to know where your backend API is.

### In Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Click on your project: **job-queue-dashboard-three**
3. Click **Settings** tab
4. Click **Environment Variables** in left sidebar
5. Add new variable:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://your-backend-name.onrender.com` |

**Important:** Replace `your-backend-name` with your actual Render backend URL (get it from Step 2)

6. Click **Save**
7. Go to **Deployments** tab
8. Click **"..."** menu on latest deployment
9. Click **Redeploy**

---

## 🚀 Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to: https://render.com/
2. Sign up with GitHub
3. Authorize Render

### 2.2 Create PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - Name: `job-queue-db`
   - Database: `job_queue_db`
   - Region: **Oregon (US West)** (or closest to you)
   - Plan: **Free**
3. Click **"Create Database"**
4. Wait ~2 minutes for creation
5. **IMPORTANT:** Copy the **"Internal Database URL"** 
   - It looks like: `postgresql://job_queue_user:xxx@dpg-xxx-a.oregon-postgres.render.com/job_queue_db`
   - Save this! You'll need it in the next step

### 2.3 Deploy Backend Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect to your GitHub repository: `Job-Queue-Dashboard`
3. Configure:

**Basic Settings:**
- Name: `job-queue-backend` (or your choice)
- Region: **Same as database** (Oregon)
- Branch: `main`
- Root Directory: `backend`
- Runtime: **Node**

**Build & Deploy:**
- Build Command:
  ```
  npm install && npm run prisma:generate && npm run build
  ```

- Start Command:
  ```
  npm run prisma:migrate:deploy && npm run start:prod
  ```

**Instance Type:**
- Plan: **Free**

4. Click **"Advanced"** to add Environment Variables

### 2.4 Add Backend Environment Variables

Click **"Add Environment Variable"** for each:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (paste the Internal Database URL from step 2.2) |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://job-queue-dashboard-three.vercel.app` |

**Important:** Make sure `CORS_ORIGIN` is EXACTLY your Vercel URL (no trailing slash!)

5. Click **"Create Web Service"**
6. Wait for deployment (~5-10 minutes)

### 2.5 Get Your Backend URL

After deployment succeeds, you'll see:
```
Your service is live at https://job-queue-backend-xxxx.onrender.com
```

**Copy this URL!** This is your backend API URL.

---

## 🔄 Step 3: Update Vercel with Backend URL

Now that you have your Render backend URL:

1. Go back to **Vercel Dashboard**
2. Your project → **Settings** → **Environment Variables**
3. Find `VITE_API_URL` variable
4. Click **Edit**
5. Update value to your Render URL: `https://job-queue-backend-xxxx.onrender.com`
6. Click **Save**
7. Go to **Deployments** tab
8. Click **"..."** on latest deployment
9. Click **"Redeploy"** → Confirm

**Wait 2-3 minutes for redeployment**

---

## ✅ Step 4: Test Your Application

### 4.1 Test Backend API

Open in browser:
```
https://job-queue-backend-xxxx.onrender.com/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-09-16T..."}
```

### 4.2 Test Frontend

1. Open: https://job-queue-dashboard-three.vercel.app/
2. Open browser DevTools (F12) → Console tab
3. Check for errors (should be none!)
4. Test creating a job:
   - Title: "Test Job"
   - Type: "test"
   - Click "Create Job"
5. ✅ Job should appear in table
6. ✅ Try updating status (Run → Complete)
7. ✅ Try filtering (click status cards)
8. ✅ Try deleting

---

## 🐛 Troubleshooting

### Frontend shows "Failed to fetch jobs"

**Problem:** API URL not set or incorrect

**Solution:**
1. Check Vercel environment variables
2. Verify `VITE_API_URL` is set correctly
3. Redeploy frontend after changing

### CORS errors in browser console

**Problem:** Backend CORS not configured for your frontend URL

**Solution:**
1. Go to Render dashboard
2. Your backend service → **Environment**
3. Check `CORS_ORIGIN` value
4. Must be: `https://job-queue-dashboard-three.vercel.app`
5. Save and wait for automatic redeploy

### Backend shows "Can't reach database server"

**Problem:** DATABASE_URL incorrect

**Solution:**
1. Go to Render → Your PostgreSQL database
2. Copy **"Internal Database URL"** (not External!)
3. Update backend `DATABASE_URL` environment variable
4. Redeploy backend

### Render Free Tier - Slow First Request

**This is normal!** 

Render free tier services "spin down" after 15 minutes of inactivity.

**Impact:**
- First request after inactivity: ~30-60 seconds
- Subsequent requests: Fast

**Tip for demo/submission:**
- Visit your backend URL 1-2 minutes before demo
- This "warms it up"

---

## 📋 Final URLs

Once everything is working, you'll have:

### For Submission:

**GitHub Repository:**
```
https://github.com/MohdAjeej/Job-Queue-Dashboard
```

**Live Frontend:**
```
https://job-queue-dashboard-three.vercel.app/
```

**Live Backend API:**
```
https://job-queue-backend-xxxx.onrender.com
```
(Replace xxxx with your actual Render subdomain)

---

## ✅ Success Checklist

- [ ] Render account created
- [ ] PostgreSQL database created on Render
- [ ] Backend deployed to Render
- [ ] Backend environment variables set:
  - [ ] DATABASE_URL (from PostgreSQL)
  - [ ] PORT (3000)
  - [ ] NODE_ENV (production)
  - [ ] CORS_ORIGIN (Vercel URL)
- [ ] Backend health check works (`/health` returns OK)
- [ ] Vercel environment variable set:
  - [ ] VITE_API_URL (Render backend URL)
- [ ] Frontend redeployed after setting env var
- [ ] Frontend loads without errors
- [ ] Can create job via UI
- [ ] Can update job status via UI
- [ ] Can filter jobs via UI
- [ ] Can delete job via UI
- [ ] No CORS errors in console

---

## 🎯 Environment Variables Summary

### Vercel (Frontend)
```
VITE_API_URL=https://job-queue-backend-xxxx.onrender.com
```

### Render (Backend)
```
DATABASE_URL=postgresql://user:password@host/database
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://job-queue-dashboard-three.vercel.app
```

---

## 📞 Quick Commands for Testing

```bash
# Test backend health
curl https://job-queue-backend-xxxx.onrender.com/health

# Test backend jobs endpoint
curl https://job-queue-backend-xxxx.onrender.com/jobs

# Create a test job
curl -X POST https://job-queue-backend-xxxx.onrender.com/jobs \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Job","type":"test"}'
```

---

**Good luck with your Render deployment!** 🚀

Remember: Replace all `xxxx` placeholders with your actual Render subdomain!
