# 🚀 FREE Deployment Guide

## **Deploy Your SAM2 Application for FREE**

This guide will help you deploy your application to get a global URL using **Render** (Backend) and **Vercel** (Frontend) - both completely free!

---

## **Step 1: Deploy Backend to Render (FREE)**

### 1.1 Go to Render.com
- Visit: https://render.com
- Sign up with your GitHub account

### 1.2 Create New Web Service
- Click **"New +"** → **"Web Service"**
- Connect your GitHub repository: `Bharath5252/Segmentation-masks-via-SAM2`

### 1.3 Configure Backend Service
- **Name**: `sam2-backend`
- **Root Directory**: `backend`
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Plan**: Free

### 1.4 Deploy
- Click **"Create Web Service"**
- Wait for deployment (2-3 minutes)
- **Save your backend URL** (e.g., `https://sam2-backend.onrender.com`)

---

## **Step 2: Deploy Frontend to Vercel (FREE)**

### 2.1 Go to Vercel.com
- Visit: https://vercel.com
- Sign up with your GitHub account

### 2.2 Create New Project
- Click **"New Project"**
- Import your repository: `Bharath5252/Segmentation-masks-via-SAM2`

### 2.3 Configure Frontend
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 2.4 Deploy
- Click **"Deploy"**
- Wait for deployment (1-2 minutes)
- **Save your frontend URL** (e.g., `https://segmentation-masks-via-sam2.vercel.app`)

---

## **Step 3: Connect Frontend to Backend**

### 3.1 Update API URL
Once you have your backend URL, update the frontend:

1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add variable:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: Your backend URL (e.g., `https://sam2-backend.onrender.com`)

### 3.2 Update Frontend Code
In your local repository, update `frontend/src/App.tsx`:

```typescript
// Change this line:
const API_BASE_URL = 'http://localhost:8000';

// To this:
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

### 3.3 Redeploy Frontend
- Commit and push the changes
- Vercel will automatically redeploy

---

## **Step 4: Test Your Deployment**

### 4.1 Test Backend
- Visit: `https://your-backend-url.onrender.com/health`
- Should show: `{"status": "healthy", "message": "SAM2 Building Segmentation API is running"}`

### 4.2 Test Frontend
- Visit your Vercel URL
- Try uploading an image
- Test mask generation and coloring

---

## **Step 5: Your Global URLs**

After deployment, you'll have:

- **Frontend**: `https://your-app-name.vercel.app`
- **Backend**: `https://your-backend-name.onrender.com`
- **API Docs**: `https://your-backend-name.onrender.com/docs`

---

## **Troubleshooting**

### Backend Issues
- **Build fails**: Check if all dependencies are in `requirements.txt`
- **Runtime errors**: Check Render logs in the dashboard
- **CORS errors**: Backend already configured for CORS

### Frontend Issues
- **API connection fails**: Verify the environment variable is set correctly
- **Build fails**: Check if all dependencies are in `package.json`
- **Runtime errors**: Check Vercel logs in the dashboard

### Common Solutions
1. **Clear browser cache** if you see old versions
2. **Check environment variables** are set correctly
3. **Verify URLs** are accessible in browser
4. **Check deployment logs** for specific errors

---

## **Success! 🎉**

Once deployed, you'll have:
- ✅ **Global Frontend URL** (Vercel)
- ✅ **Global Backend URL** (Render)
- ✅ **Interactive API Documentation** (Swagger UI)
- ✅ **Fully Functional Application**

Your application will be accessible from anywhere in the world!

---

## **Next Steps**

1. **Share your URLs** for submission
2. **Test all features** work correctly
3. **Monitor usage** in Render/Vercel dashboards
4. **Scale up** if needed (both platforms offer paid plans)

---

## **Support**

- **Render Support**: https://render.com/docs
- **Vercel Support**: https://vercel.com/docs
- **GitHub Repository**: https://github.com/Bharath5252/Segmentation-masks-via-SAM2 