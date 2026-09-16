# Quick Deployment Reference

## ✅ What You Have

**Frontend:** https://job-queue-dashboard-three.vercel.app/  
**GitHub:** https://github.com/MohdAjeej/Job-Queue-Dashboard

---

## 🎯 What You Need to Do

### 1. Deploy Backend to Render (15 minutes)

Go to: **https://render.com/**

#### A. Create PostgreSQL Database
- New → PostgreSQL
- Name: `job-queue-db`
- Plan: Free
- **Copy the "Internal Database URL"** ← IMPORTANT!

#### B. Create Web Service
- New → Web Service  
- Connect GitHub: `Job-Queue-Dashboard`
- Root Directory: `backend`
- Build Command:
  ```
  npm install && npm run prisma:generate && npm run build
  ```
- Start Command:
  ```
  npm run prisma:migrate:deploy && npm run start:prod
  ```

#### C. Environment Variables
```
DATABASE_URL = (paste from step A)
PORT = 3000
NODE_ENV = production
CORS_ORIGIN = https://job-queue-dashboard-three.vercel.app
```

#### D. Wait for Deployment
- Takes ~5-10 minutes
- You'll get URL: `https://job-queue-backend-xxxx.onrender.com`
- **Copy this URL!**

---

### 2. Update Vercel Environment Variable (2 minutes)

Go to: **https://vercel.com/dashboard**

1. Click your project
2. Settings → Environment Variables
3. Add or Edit:
   ```
   VITE_API_URL = https://job-queue-backend-xxxx.onrender.com
   ```
   (Use your actual Render URL from step 1D)
4. Save
5. Deployments → Redeploy

---

### 3. Test Everything (3 minutes)

#### Test Backend:
```
https://job-queue-backend-xxxx.onrender.com/health
```
Should return: `{"status":"ok"}`

#### Test Frontend:
1. Open: https://job-queue-dashboard-three.vercel.app/
2. Press F12 (DevTools)
3. Check Console for errors
4. Create a job
5. Update status
6. Delete job

✅ Everything should work!

---

## 🚨 Common Issues

### "Failed to fetch jobs"
→ Update `VITE_API_URL` in Vercel and redeploy

### CORS Error
→ Update `CORS_ORIGIN` in Render to: `https://job-queue-dashboard-three.vercel.app`

### Slow First Request
→ Normal! Render free tier "wakes up" (30-60 sec)

---

## 📝 For Submission

**GitHub:**  
https://github.com/MohdAjeej/Job-Queue-Dashboard

**Live Frontend:**  
https://job-queue-dashboard-three.vercel.app/

**Live Backend:**  
https://job-queue-backend-xxxx.onrender.com  
(Replace `xxxx` with your Render subdomain)

---

**Total Time: ~20 minutes** ⏱️

See **VERCEL_RENDER_SETUP.md** for detailed step-by-step instructions!
