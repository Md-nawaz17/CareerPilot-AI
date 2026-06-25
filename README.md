# CareerPilot AI

CareerPilot AI is a production-ready SaaS platform for resume analysis, ATS scoring, job matching, interview preparation, and career planning.

## Architecture

- Frontend: React + Vite + Tailwind CSS
- Backend: FastAPI + Python 3.11+
- Database: Supabase PostgreSQL
- Auth: Supabase Auth
- Deployment: Vercel + Render + Docker

## Project Structure

- frontend/: React application
- backend/: FastAPI application
- tests/: API and integration tests

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Testing

```bash
pytest backend/tests
npm --prefix frontend test
```
