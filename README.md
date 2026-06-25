# CareerPilot AI

CareerPilot AI is a polished ATS resume analyzer and career assistant experience for recruiters, candidates, and portfolio showcases.

## Architecture

- Frontend: React + Vite + Tailwind CSS + Framer Motion
- Backend: Python router-based analysis service
- Testing: Vitest + pytest
- Deployment: Vercel + Render + Docker

## Features

- Resume upload and parsing for PDF, DOCX, and plain text
- ATS score generation with a weighted breakdown
- Job-description matching with recruiter-style summary
- Responsive SaaS-style dashboard experience

## Project Structure

- frontend/: React application
- backend/: Python analysis service
- tests/: API and integration tests

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
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
npm --prefix frontend run build
```

## Deployment

- Frontend: Vercel using [vercel.json](vercel.json)
- Backend: Render using [render.yaml](render.yaml)
- Environment examples: [backend/.env.example](backend/.env.example) and [frontend/.env.example](frontend/.env.example)
