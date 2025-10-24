# KeyGo Deployment Guide: Supabase + Netlify

## Architecture Overview
- **Backend + Database**: Supabase (Free tier)
- **Frontend**: Netlify (Free tier)
- **Total Cost**: $0/month

## Why Supabase?
- ✅ **Free tier**: 500MB database, 50MB file storage
- ✅ **Built-in PostgreSQL** database
- ✅ **Automatic API generation** from database schema
- ✅ **Real-time subscriptions**
- ✅ **Built-in authentication** (if you want to use it later)
- ✅ **Easy GitHub integration**

## Step 1: Deploy Backend to Supabase

### 1.1 Setup Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** → **"Sign up"**
3. Sign up with GitHub (recommended)

### 1.2 Create New Project
1. Click **"New project"**
2. Choose your **organization** (or create one)
3. Fill in project details:
   - **Name**: `keygo-app` (or whatever you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"**

### 1.3 Wait for Setup
- Supabase will create your project (takes 2-3 minutes)
- You'll see a dashboard with your project details

### 1.4 Get Your Project Credentials
1. Go to **Settings** → **API**
2. Copy these values (you'll need them):
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role secret key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 1.5 Get Database Connection String
1. Go to **Settings** → **Database**
2. Copy the **Connection string** (URI format)
3. It looks like: `postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres`

### 1.6 Deploy Your Flask Backend
Since Supabase doesn't directly host Flask apps, we have two options:

#### Option A: Use Supabase Edge Functions (Recommended)
1. Install Supabase CLI: `npm install -g supabase`
2. Initialize Supabase in your project: `supabase init`
3. Deploy your Flask app as an Edge Function

#### Option B: Deploy Flask to Render/Heroku (Easier)
1. Deploy your Flask backend to **Render** or **Heroku**
2. Use Supabase only for the database
3. Update your Flask app to connect to Supabase PostgreSQL

**I recommend Option B for simplicity. Let's use Render for the Flask backend and Supabase for the database.**

## Step 2: Deploy Flask Backend to Render

### 2.1 Setup Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### 2.2 Deploy Backend
1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `keygo-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`

### 2.3 Configure Environment Variables
In Render dashboard → Environment tab:
```
DATABASE_URL=<your-supabase-postgresql-connection-string>
SECRET_KEY=your-super-secret-key-change-this
FLASK_ENV=production
PORT=5000
```

### 2.4 Deploy
Click **"Create Web Service"** - Render will deploy your backend

## Step 3: Deploy Frontend to Netlify

### 3.1 Setup Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub

### 3.2 Deploy Frontend
1. Click **"New site from Git"** → **"GitHub"**
2. Select your KeyGo repository
3. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`

### 3.3 Configure Environment Variables
In Netlify → Site settings → Environment variables:
```
REACT_APP_API_URL=https://your-render-backend-url.onrender.com
```

### 3.4 Deploy
Click **"Deploy site"** - Netlify will build and deploy your frontend

## Step 4: Update CORS Settings

Update your `backend/app.py` CORS configuration:
```python
CORS(app, origins=[
    "http://localhost:3000",  # Local development
    "https://your-netlify-url.netlify.app",  # Your Netlify URL
    "https://*.netlify.app",  # Allow all Netlify preview deployments
    "https://*.supabase.co"  # Allow Supabase domains
])
```

## Step 5: Test Your Deployment

1. **Backend Health Check**: Visit `https://your-render-url.onrender.com/api/health`
2. **Frontend**: Visit your Netlify URL
3. **Test Registration**: Create a new account
4. **Test Features**: Create shortcuts, search, etc.

## Environment Variables Summary

### Render (Backend):
```
DATABASE_URL=<supabase-postgresql-connection-string>
SECRET_KEY=<your-secret-key>
FLASK_ENV=production
PORT=5000
```

### Netlify (Frontend):
```
REACT_APP_API_URL=https://your-render-backend-url.onrender.com
```

### Supabase (Database):
- **Project URL**: `https://your-project-id.supabase.co`
- **Database**: PostgreSQL (automatically provided)
- **Connection**: Via the DATABASE_URL environment variable

## Cost Breakdown
- **Supabase**: Free tier (500MB database, 50MB storage)
- **Render**: Free tier (750 hours/month)
- **Netlify**: Free tier (100GB bandwidth/month)
- **Total**: $0/month for small to medium usage

## Supabase Features You Get
- ✅ **PostgreSQL database** with web interface
- ✅ **Automatic API generation**
- ✅ **Real-time subscriptions**
- ✅ **Built-in authentication** (if needed later)
- ✅ **Database backups**
- ✅ **SQL editor** in dashboard

## Troubleshooting

### Common Issues:

1. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check Supabase project is active
   - Ensure database password is correct

2. **CORS Errors**
   - Make sure CORS origins include your Netlify domain
   - Check that REACT_APP_API_URL is set correctly

3. **Build Failures**
   - Check Render build logs
   - Verify all dependencies are in requirements.txt

4. **API Not Found**
   - Verify Render backend URL is correct
   - Check that backend deployed successfully

## Next Steps After Deployment
1. Set up monitoring and alerts
2. Configure custom domains
3. Explore Supabase features (real-time, auth, etc.)
4. Consider upgrading to paid tiers as you scale
5. Set up automated backups