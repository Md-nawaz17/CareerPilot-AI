# Deployment Guide

## Frontend (Vercel)
1. Import the repository into Vercel.
2. Set the root directory to `frontend`.
3. Use the build command `npm run build`.
4. Set the output directory to `dist`.
5. Add `VITE_API_BASE_URL` and `VITE_APP_NAME` as environment variables.

## Backend (Render)
1. Create a Render web service from the `backend` folder.
2. Set the build command to `pip install -r requirements.txt`.
3. Set the start command to `uvicorn app.main:app --host 0.0.0.0 --port 10000`.
4. Add `ENVIRONMENT`, `SECRET_KEY`, and `ALLOWED_ORIGINS` as environment variables.

## Database (MongoDB Atlas)
1. Create a MongoDB Atlas cluster.
2. Configure a database user and network access.
3. Store the connection string in environment variables for future persistence layer integration.

## CI/CD
- GitHub Actions runs backend tests, frontend tests, and the production build automatically via [.github/workflows/ci.yml](.github/workflows/ci.yml).
