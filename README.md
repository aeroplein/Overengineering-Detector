# Overengineer Detector

Overengineer Detector is a small Express and PostgreSQL app that scores a project stack for unnecessary complexity. Users can register, log in, create projects, attach technologies, and run a rule-based analysis that returns scores, flags, and recommendations.

## Stack

- Node.js and Express
- PostgreSQL with `pg`
- JWT authentication
- Static HTML, CSS, and JavaScript frontend served by Express

## Setup

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Create a local environment file:

```bash
copy .env.example .env
```

3. Create a PostgreSQL database matching `DB_NAME` in `.env`.

4. Run the schema and seed data:

```bash
psql -U postgres -d overengineering_detector -f ..\sql_scripts\tables.sql
psql -U postgres -d overengineering_detector -f ..\sql_scripts\populate_data.sql
```

Run the seed file once for a fresh database. If it is run multiple times, duplicate technology rows may be inserted; the app de-duplicates them when listing technologies.

5. Start the app:

```bash
npm run dev
```

6. Open:

```text
http://localhost:3000
```

## Environment

Use `backend/.env.example` as the template:

```env
PORT=3000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=overengineering_detector
DB_PASSWORD=your_database_password
DB_PORT=5432
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1d
```

## Endpoints

### Auth

- `POST /auth/register`
  - Body: `{ "email": "user@example.com", "password": "secret123" }`
- `POST /auth/login`
  - Body: `{ "email": "user@example.com", "password": "secret123" }`
  - Returns: `{ "token": "...", "user": { "id": 1, "email": "user@example.com" } }`

### Projects

All project routes require:

```http
Authorization: Bearer <token>
```

- `POST /projects`
  - Body: `{ "name": "Portfolio API", "daily_users": 50, "scale": "Personal", "visibility": "private" }`
- `GET /projects`
  - Returns projects owned by the logged-in user.
- `GET /projects/:id`
  - Returns one project if it belongs to the logged-in user.
- `PUT /projects/:id`
  - Updates one project if it belongs to the logged-in user.
- `DELETE /projects/:id`
  - Deletes one project if it belongs to the logged-in user.
- `POST /projects/:id/technologies`
  - Body: `{ "technologyIds": [1, 8, 23] }`
  - Replaces the selected technologies for a project owned by the logged-in user.
- `GET /projects/:id/technologies`
  - Returns selected technologies for a project owned by the logged-in user.
- `GET /technologies`
  - Returns available technologies for selection.

### Analysis

Analysis routes require:

```http
Authorization: Bearer <token>
```

- `POST /analysis/:projectId`
  - Runs analysis for a project owned by the logged-in user.
  - Returns deterministic scores, flags, recommendations, and a local AI-style explanation.
- `GET /analysis/:projectId/history`
  - Returns analysis history with saved flags and recommendations for a project owned by the logged-in user.

### Utility

- `GET /health`
- `GET /db-test`
- `GET /openapi.json`

## Frontend

The minimal frontend is in `frontend/` and is served by the Express server. It includes:

- Register screen
- Login screen
- Project list
- Create project form
- Technology selection
- Analysis result display
- Analysis history display
- Score dashboard with Chart.js visualization
- Local storage token persistence and logout

## Scoring and AI/ML Note

Rule-based scoring is the source of truth. The app calculates scores from technology weights, project scale, user count, penalties, flags, and recommendations. The AI-style explanation is deterministic and local: it summarizes the same project context, scores, flags, and recommendations without calling an external AI service. It is returned with a new analysis response, but it is not required for persistence.

## Notes

- New projects are saved with the authenticated `req.user.id`.
- `GET /projects` only returns projects owned by the logged-in user.
- JWT signing and verification use `JWT_SECRET` from `.env`, with a local fallback for development.
