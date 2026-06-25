# Deployment Guide

## Frontend (Vercel)
1. Create a Vercel project from the frontend folder.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Add environment variables as needed.

## Backend (Render)
1. Create a Render web service from the backend folder.
2. Set the build command to `pip install -r requirements.txt`.
3. Set the start command to `uvicorn app.main:app --host 0.0.0.0 --port 10000`.

## Database (Supabase)
1. Create a Supabase project.
2. Configure PostgreSQL, auth, and storage.
3. Store connection details in environment variables.

## CI/CD
- GitHub Actions workflow is available in [.github/workflows/ci.yml](.github/workflows/ci.yml).
