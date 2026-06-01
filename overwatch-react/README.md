# Overwatch Stats Dashboard

A full-stack Overwatch stats dashboard for searching players, browsing heroes and maps, comparing player performance, and saving authenticated search history.

## Features

- Player search with BattleTag support
- Player comparison view with hero statistics and competitive rank summaries
- Hero and map browsing using Overfast API data
- User registration, login, logout, and session tokens
- Battle.net profile linking
- Saved search history for signed-in users
- Flask API proxy to avoid client-side cross-origin issues
- SQLite-backed user, session, and search-history storage

## Tech Stack

- React 19
- Vite
- Flask
- SQLite
- Overfast API

## Getting Started

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
pip install -r server/requirements.txt
```

Run the backend:

```bash
npm run backend
```

Run the frontend in another terminal:

```bash
npm run dev
```

The Vite dev server proxies `/api` requests to `http://127.0.0.1:5000`.

## Scripts

- `npm run dev` starts the Vite development server
- `npm run backend` starts the Flask backend
- `npm run build` creates a production frontend build
- `npm run lint` checks the React source with ESLint
- `npm run preview` previews the production build

## Environment Variables

Backend:

- `OVERFAST_BASE_URL` overrides the upstream Overfast API URL
- `UPSTREAM_TIMEOUT_SECONDS` controls upstream request timeout
- `DATABASE_PATH` sets the SQLite database path
- `CORS_ORIGIN` controls the allowed CORS origin
- `FLASK_HOST`, `FLASK_PORT`, and `FLASK_DEBUG` configure local Flask startup

Frontend:

- `VITE_API_BASE_URL` overrides the API base URL. Defaults to `/api`.
