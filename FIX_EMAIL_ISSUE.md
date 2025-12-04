# Fix: Email Still Showing Wrong URL

## 🔍 Where the Email is Created

The email is generated in: **`backend/app/worker.py`** → `send_verification_email_task()` function (lines 28-61)

## ❌ Why You're Still Getting the Old Email

**The Celery worker is using OLD CACHED CODE!**

Celery workers load Python code when they start and cache it. Even though you updated the code, the worker is still running the old version.

## ✅ Solution: Restart Celery Worker

### If Using Docker Compose:

```bash
cd backend
docker-compose restart worker
# OR completely restart everything:
docker-compose down
docker-compose up --build
```

### If Running Manually:

1. **Find the Celery worker process:**
   ```bash
   ps aux | grep celery
   ```

2. **Kill the old worker:**
   ```bash
   # Find the PID and kill it
   kill <PID>
   # OR kill all celery processes
   pkill -f celery
   ```

3. **Restart the worker:**
   ```bash
   cd backend
   celery -A app.core.celery_app:celery_app worker --loglevel=info
   ```

## 🔍 Verify the Fix

After restarting, check the logs when you register a new user:

```bash
# You should see in the logs:
Processing verification email for user@example.com
Generated verification link: http://localhost:8000/v1/auth/verify-email?token=...
```

## 📝 Check Your .env File

Make sure `backend/.env` has:

```env
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

## 🚨 Important Notes

1. **Register a NEW user** - Old tokens won't work with the new code
2. **Check backend logs** - The log will show the exact URL being generated
3. **If using SendGrid/SES** - Some email services have link tracking that might modify URLs. Check your email service settings.

## 🔍 Debug: Check What URL is Being Generated

Add this to see what's happening:

```python
# In backend/app/worker.py, line 42 already has:
logger.info(f"Generated verification link: {link}")
```

Check your Celery worker logs to see what URL is actually being generated.



