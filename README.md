# Extended Planner

A modern web application for personal planning and goal tracking, built with Next.js, Mantine UI, and FastAPI.

## Features

- GitHub-style consistency graph for tracking daily activities
- Goal setting and long-term goal pinning
- Daily task management
- Modern UI with Mantine components

## Project Structure

```
extended-planner/
├── frontend/           # Next.js frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Next.js pages
│   │   ├── hooks/        # Custom React hooks
│   │   ├── styles/       # Global styles
│   │   └── utils/        # Utility functions
│   └── public/          # Static assets
│
└── backend/           # FastAPI backend application
    ├── app/
    │   ├── api/         # API routes
    │   ├── models/      # Database models
    │   ├── schemas/     # Pydantic schemas
    │   └── services/    # Business logic
    └── tests/          # Backend tests
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Python (v3.8 or later)
- PostgreSQL (v13 or later)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Development

- Frontend runs on http://localhost:3000
- Backend API runs on http://localhost:8000
- API documentation available at http://localhost:8000/docs

## License

MIT
