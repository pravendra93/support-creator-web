# How to Start Backend and Frontend

## Quick Start Guide

### Option 1: Using Docker Compose (Recommended)

This will start all services: Backend API, Redis, Celery Worker, and Flower (Celery monitoring).

#### 1. Start Backend Services
```bash
cd backend
docker-compose up --build
```

This will:
- Build and start the FastAPI backend on `http://localhost:8000`
- Start Redis on port `6379`
- Start Celery worker for background tasks (email sending)
- Start Flower (Celery monitoring) on `http://localhost:5555`

#### 2. Start Frontend (in a new terminal)
```bash
# From project root
npm install  # Only needed first time or after package.json changes
npm run dev
```

Frontend will run on `http://localhost:3000`

---

### Option 2: Manual Start (Without Docker)

#### Prerequisites
- Python 3.11+
- Node.js 18+
- Redis running locally

#### 1. Start Redis
```bash
# macOS (using Homebrew)
brew services start redis

# Or run directly
redis-server
```

#### 2. Start Backend
```bash
cd backend

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the server (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Start Celery Worker (in a new terminal)
```bash
cd backend
celery -A app.core.celery_app:celery_app worker --loglevel=info
```

#### 4. Start Frontend (in a new terminal)
```bash
# From project root
npm install  # Only needed first time
npm run dev
```

---

## Environment Variables

Make sure you have a `.env` file in the `backend/` directory with:

```env
# Database
DATABASE_URL=your_database_url

# Frontend/Backend URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Redis (for Celery)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Email Settings
EMAIL_PROVIDER=console  # or ses, sendgrid, smtp
EMAIL_FROM=noreply@example.com

# Other settings as needed...
```

---

## Testing Email Verification

1. **Register a new user** at `http://localhost:3000/register`
2. Check your backend logs for the verification email (if using `EMAIL_PROVIDER=console`)
3. Click the verification link in the email
4. You should see the success page and be redirected to login

---

## Troubleshooting

### Backend not starting?
- Check if port 8000 is already in use
- Verify your `.env` file exists and has correct values
- Check database connection

### Celery worker not processing emails?
- Make sure Redis is running
- Check Celery worker logs for errors
- Verify `CELERY_BROKER_URL` in `.env`

### Frontend not connecting to backend?
- Verify `BACKEND_URL` in backend `.env` is `http://localhost:8000`
- Check Next.js proxy settings in `next.config.ts`
- Check browser console for CORS errors

---

## Useful Commands

### Stop all Docker services
```bash
cd backend
docker-compose down
```

### View backend logs
```bash
# Docker
docker-compose logs -f web

# Manual
# Logs appear in the terminal where uvicorn is running
```

### Rebuild after code changes
```bash
# Docker (rebuilds containers)
docker-compose up --build

# Manual (backend auto-reloads with --reload flag)
# Frontend auto-reloads with npm run dev
```



