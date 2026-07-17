# Employee Management System (EMS)

A full-stack employee management system with role-based access control (RBAC), organizational hierarchy management, and secure authentication — built with Next.js, Express, and PostgreSQL, fully containerized with Docker.

## Features

- **JWT-based authentication** with bcrypt password hashing
- **Role-based access control (RBAC)** — field-level enforcement, not just route-level (e.g. sensitive fields like salary are protected at the model layer)
- **Self-referencing organizational hierarchy** with cycle detection (prevents invalid reporting structures)
- **Employee management** — full CRUD with search, filter, sort, and pagination handled server-side
- **CSV bulk import** with per-row error handling
- **Dashboard** with live aggregated stats
- **Dark mode** (class-based theming)
- **Automated tests** covering auth, RBAC edge cases, and organizational hierarchy logic

## Tech Stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Frontend   | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend    | Node.js, Express                    |
| Database   | PostgreSQL, Sequelize ORM           |
| Auth       | JWT, bcrypt                         |
| Testing    | Jest                                |
| Containerization | Docker, Docker Compose        |

## Project Structure

```
ems/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route handlers (auth, employees, organization)
│   │   ├── middleware/      # Auth, RBAC, validation, file upload
│   │   ├── models/          # Sequelize models (Employee, User)
│   │   ├── routes/          # API route definitions
│   │   ├── seeders/         # Database seed script
│   │   ├── tests/           # Jest test suites
│   │   ├── validators/      # Request validation schemas
│   │   └── server.js        # App entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable React components
│   ├── context/             # Auth & Theme context providers
│   ├── lib/                 # API client
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Git

No local installation of Node.js, npm, or PostgreSQL is required — everything runs inside containers.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Yashhh0602/Employee-Management-System.git
cd Employee-Management-System
```

### 2. Environment variables

Create a `.env` file inside the `backend/` folder (this is gitignored and not included in the repo for security):

```env
NODE_ENV=development
PORT=5000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ems_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=1h
```

> **Note:** `DB_HOST` must be `postgres` (the Docker service name), not `localhost`, since the backend connects to the database over the internal Docker network.

### 3. Build and start all services

From the project root:

```bash
docker compose up --build
```

This starts three containers:
- `postgres` — PostgreSQL database (port `5432`)
- `backend` — Express API server (port `5000`)
- `frontend` — Next.js app (port `3000`)

Wait for the logs to show the backend connected to the database and the frontend ready. First build may take a few minutes.

### 4. Seed the database (first run only)

In a new terminal, run the seed script inside the backend container to create initial users and sample data:

```bash
docker exec -it ems-backend-1 npm run seed
```

> **Warning:** this drops and recreates all tables (`sequelize.sync({ force: true })`) — only run this on a fresh database. Running it again later will wipe any existing data.

This creates three accounts, one for each role, useful for testing RBAC:

| Role         | Email              | Password    |
|--------------|--------------------|-------------|
| Super Admin  | `admin@ems.com`    | `Admin@123` |
| HR Manager   | `hr@ems.com`       | `Hr@12345`  |
| Employee     | `employee@ems.com` | `Emp@12345` |

> These are default seed credentials for local/dev use only. Change them (or seed different data) before any real/production use.

### 5. Access the app

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000/api](http://localhost:5000/api)

Log in with any of the accounts above.

## Running in the Background

To run the app without keeping the terminal open:

```bash
docker compose up -d
```

To stop everything:

```bash
docker compose down
```

To view logs while running detached:

```bash
docker compose logs -f
```

## Running Tests

Backend tests (auth, RBAC, organizational hierarchy) run inside the backend container:

```bash
docker exec -it ems-backend-1 npm test
```

## Troubleshooting

**Port already in use (3000, 5000, or 5432):**
Something else on your machine is using that port. Find and stop it:

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

**Backend can't connect to the database:**
Ensure `DB_HOST=postgres` in `backend/.env` (not `localhost`) — the backend needs the Docker service name to resolve the database over the internal network.

**Changes to code not reflecting:**
Rebuild the affected container:

```bash
docker compose up --build
```

**Full reset (clears all data):**

```bash
docker compose down -v
docker compose up --build
```

The `-v` flag also removes the database volume, giving you a completely fresh start.

## API Documentation

All endpoints (except login) require a valid JWT in the `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint              | Access | Description                     |
|--------|------------------------|--------|----------------------------------|
| POST   | `/api/auth/login`      | Public | Authenticate, returns JWT + user info |
| POST   | `/api/auth/logout`     | Auth   | Invalidate current session      |

### Employees

| Method | Endpoint                        | Access                          | Description                                  |
|--------|----------------------------------|----------------------------------|-----------------------------------------------|
| GET    | `/api/employees`                | Super Admin, HR                 | List employees — supports search, filter, sort, pagination |
| GET    | `/api/employees/:id`            | Super Admin, HR, Employee (self)| Get a single employee's details              |
| POST   | `/api/employees`                | Super Admin, HR                 | Create a new employee                        |
| PUT    | `/api/employees/:id`            | Super Admin, HR, Employee (self, limited fields) | Update an employee                |
| DELETE | `/api/employees/:id`            | Super Admin only                | Delete/deactivate an employee                |
| GET    | `/api/employees/dashboard`      | Super Admin, HR                 | Aggregated stats: total/active/inactive employees, department counts |
| GET    | `/api/employees/:id/reportees`  | Super Admin, HR                 | List an employee's direct reports            |

**Query parameters for `GET /api/employees`:**
`search` (name/email), `department`, `role`, `status`, `sortBy` (`name` \| `joiningDate`), `order` (`ASC` \| `DESC`), `page`, `limit`

### Organization

| Method | Endpoint                        | Access             | Description                                   |
|--------|-----------------------------------|---------------------|------------------------------------------------|
| GET    | `/api/organization/tree`         | Super Admin, HR    | Full organizational reporting tree             |
| PATCH  | `/api/employees/:id/manager`     | Super Admin        | Reassign an employee's reporting manager (cycle-checked) |

> Full route definitions and validation rules are in `backend/src/routes/` and `backend/src/validators/`.

## Role Permissions

| Action                          | Super Admin | HR Manager | Employee            |
|----------------------------------|:-----------:|:----------:|:--------------------:|
| View all employees               | ✅          | ✅         | ❌ (self only)        |
| Create employee                  | ✅          | ✅         | ❌                     |
| Edit any employee                | ✅          | ✅         | ❌                     |
| Edit own profile (limited fields)| ✅          | ✅         | ✅                     |
| Delete employee                  | ✅          | ❌         | ❌                     |
| Assign roles / managers          | ✅          | ❌         | ❌                     |
| View organizational tree         | ✅          | ✅         | ❌ (own chain only)    |

## Features Implemented

- [x] JWT authentication with protected routes
- [x] RBAC (Super Admin / HR Manager / Employee), enforced at both route and field level
- [x] Employee CRUD with all required fields
- [x] Self-referencing organizational hierarchy with circular-reporting prevention
- [x] Dashboard (total / active / inactive employees, department breakdown)
- [x] Search, filter, and sort (server-side)
- [x] Server-side pagination
- [x] Frontend + backend validation
- [x] CSV bulk import
- [x] Dark mode
- [x] Docker containerization (this repo)
- [x] Unit tests (auth, RBAC, organizational hierarchy — see `backend/src/tests/`)
- [ ] Live deployment (see Deployment section below once live)

## Deployment

- **Frontend:** _add live Vercel URL here once deployed_
- **Backend API:** _add live Render URL here once deployed_

## Screenshots

_Add screenshots or a short demo GIF/video link here — login screen, dashboard, employee list, organization tree._

## License

MIT — feel free to use this as a reference.
