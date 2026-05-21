# Overengineering Detector

A full‑stack application that analyses a project's technology stack and scores it for **over‑engineering** or **under‑engineering**. It provides:

- A **RESTful JSON API** built with **Express** (Node.js).
- Full **CRUD** for the `Project` entity (create, read, update, delete).
- JWT‑based authentication (register / login / logout).
- Business logic isolated in a **service layer**.
- Input validation on both the back‑end (validators) and front‑end (HTML5 attributes + runtime checks).
- **Unit tests** for core scoring and analysis logic.
- Additional features: what‑if simulations, project comparison, admin‑only technology management, knowledge base, interactive Swagger UI.
- **OpenAPI 3.0 specification** (`/openapi.json`).
- Front‑end built with **plain HTML, CSS, and vanilla JavaScript** (no frameworks) and communicates with the API using the native `fetch` API.
- Detailed **README** (this file) with setup instructions.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Installation](#installation)
4. [Running the Application](#running-the-application)
5. [API Documentation](#api-documentation)
6. [Testing](#testing)
7. [Additional Features](#additional-features)
8. [Troubleshooting](#troubleshooting)
9. [License](#license)

---

## Prerequisites

- **Node.js** (v20 or later) – includes npm.
- **PostgreSQL** database (v15 recommended).
- **Git** (optional, for cloning).

---

## Project Structure

```
OverEngineeringDetector/
│
├─ backend/               # Express server
│   ├─ src/               # Source code
│   │   ├─ config/        # env & DB config
│   │   ├─ controllers/   # Route handlers (thin, call services)
│   │   ├─ docs/          # OpenAPI spec (openapiSpec.js)
│   │   ├─ middleware/    # auth & error middleware
│   │   ├─ routes/        # Express routers
│   │   ├─ services/      # Business logic (project, analysis, scoring…)
│   │   ├─ utils/         # Validators, helpers
│   │   └─ server.js      # Main entry point, serves static frontend & Swagger UI
│   ├─ test/              # Unit tests (node:test)
│   ├─ package.json       # Scripts, dependencies, devDependencies
│   └─ .env.example       # Example environment variables
│
├─ frontend/              # Vanilla HTML/CSS/JS UI
│   ├─ index.html
│   ├─ styles.css
│   └─ app.js
│
├─ sql_scripts/           # Database schema & seed files (if any)
│
└─ README.md              # **This file**
```

---

## Installation

1. **Clone the repository** (or copy the extracted folder):
   ```bash
   git clone <repository-url>
   cd OverEngineeringDetector
   ```
2. **Install back‑end dependencies**:
   ```bash
   cd backend
   npm ci
   ```
3. **Create a PostgreSQL database** and a user. Example using `psql`:
   ```sql
   CREATE DATABASE overengineer;
   CREATE USER overengineer_user WITH ENCRYPTED PASSWORD 'your_strong_password';
   GRANT ALL PRIVILEGES ON DATABASE overengineer TO overengineer_user;
   ```
4. **Configure environment variables**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and set the database connection URI, e.g.:
     ```dotenv
     DATABASE_URL=postgres://overengineer_user:your_strong_password@localhost:5432/overengineer
     JWT_SECRET=your_random_secret
     PORT=3001
     ```
5. **Run database migrations** (if provided) or create the tables manually using the scripts in `sql_scripts/`.
   ```bash
   # Example (adjust path to your SQL file)
   psql $DATABASE_URL -f ../sql_scripts/init.sql
   ```

---

## Running the Application

### Development mode
```bash
npm run dev   # starts the server (default port 3001)
```
The server will:
- Serve the static front‑end from `../frontend`.
- Expose the API under `/` (e.g., `/auth/login`).
- Serve Swagger UI at **http://localhost:3001/api-docs**.
- Serve the OpenAPI JSON at **http://localhost:3001/openapi.json**.

Open a browser and navigate to `http://localhost:3001` to use the UI.

### Production build (optional)
For a production‑ready start you can use a process manager such as **PM2**:
```bash
npm install -g pm2
pm2 start src/server.js --name overengineer
```

---

## API Documentation

The API follows the **OpenAPI 3.0** specification located in `backend/src/docs/openapiSpec.js`. Key endpoints:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Register a new user (email + password). |
| `POST` | `/auth/login`    | Log in and receive an HttpOnly JWT cookie. |
| `POST` | `/auth/logout`   | Clear the JWT cookie. |
| `GET`  | `/projects`      | List projects for the authenticated user. |
| `POST` | `/projects`      | Create a new project. |
| `GET`  | `/projects/{id}` | Retrieve a single project. |
| `PUT`  | `/projects/{id}` | Update a project. |
| `DELETE`| `/projects/{id}`| Delete a project (204 No Content). |
| `GET`  | `/projects/{id}/technologies` | List technologies attached to a project. |
| `POST` | `/projects/{id}/technologies` | Replace the technology selection for a project. |
| `GET`  | `/technologies`  | List all active technologies (selectable by users). |
| `GET`  | `/admin/technologies` | **Admin only** – list all technologies (active & inactive). |
| `POST` | `/admin/technologies` | **Admin only** – create a technology. |
| `PUT`  | `/admin/technologies/{id}` | **Admin only** – update a technology. |
| `DELETE`| `/admin/technologies/{id}`| **Admin only** – soft‑delete (set `is_active = false`). |
| `POST` | `/analysis/{projectId}` | Run deterministic analysis for a project. |
| `GET`  | `/analysis/{projectId}/dashboard` | Retrieve latest analysis dashboard data. |
| `GET`  | `/analysis/{projectId}/history` | List analysis history for a project. |
| `POST` | `/analysis/{projectId}/what-if` | Run a non‑persisted what‑if simulation. |
| `GET`  | `/analysis/compare?leftProjectId=...&rightProjectId=...` | Compare two projects. |
| `GET`  | `/openapi.json` | Raw OpenAPI spec (used by Swagger UI). |
| `GET`  | `/api-docs` | Interactive Swagger UI (served via `swagger-ui-dist`). |

All request and response bodies are **JSON**. Errors follow the shape `{ "error": "Message" }` and use appropriate HTTP status codes.

---

## Testing

Unit tests are located in `backend/test/`. They use the built‑in `node:test` runner.
```bash
cd backend
npm test
```
The test suite covers:
- Score calculation (`calculateScores`).
- Evaluation mapping (`generateEvaluation`).
- Flag generation (`generateFlags`).
- Recommendation and badge generation.
- Radar data creation.

All tests should pass (exit code 0). If you add new business logic, extend the test suite accordingly.

---

## Additional Features

Beyond the required CRUD:
- **JWT authentication** with HttpOnly cookies (secure session handling).
- **What‑if simulator** to explore alternate technology selections without persisting.
- **Project comparison** endpoint for side‑by‑side risk analysis.
- **Admin technology management** (soft‑delete, activate/deactivate).
- **Knowledge base** that aggregates technology descriptions for users.
- **Interactive charts** (bar & ring charts) generated client‑side using vanilla JS.
- **Swagger UI** (served at `/api-docs`) for developer-friendly API exploration.
- **OpenAPI spec** maintained in a single source file (`openapiSpec.js`).

---

## Troubleshooting

- **Port already in use** – change the `PORT` value in `.env`.
- **Database connection errors** – verify `DATABASE_URL` is correct and the PostgreSQL server is running.
- **JWT errors** – ensure `JWT_SECRET` is a sufficiently random string and matches between client & server.
- **CORS issues** – the front‑end is served from the same origin, so CORS is not needed. If you separate them, configure appropriate CORS middleware.
- **Swagger UI not loading** – confirm `swagger-ui-dist` is installed (`npm ci` should have added it) and that `app.use('/api-docs/assets', express.static(swaggerUiPath));` line exists in `server.js`.

---

## License

This project is provided **as‑is** for educational purposes. Feel free to adapt, extend, or reuse the code in accordance with your institution’s policies.

---

*End of README.*
