# Employee Management System (EMS)

A full stack employee management system with field level role based access control, a self referencing org hierarchy with cycle detection, and a background job queue. Built with Next.js, Express and PostgreSQL, containerized with Docker, tested in CI against real Postgres and Redis, and deployed to a local Kubernetes cluster.

## Live Demo Walkthrough



https://github.com/user-attachments/assets/05fe70fd-8537-4400-bd47-def4dbcb608f



> The hosted deployment is offline. The walkthrough above shows every feature running end to end.

## Highlights

* **Field level RBAC, not just route level.** Sensitive fields like salary are protected at the model layer, so an employee editing their own profile cannot change their salary even with a hand crafted request.
* **Self referencing org hierarchy with cycle detection.** Reassigning a manager is checked so nobody can end up reporting to themselves through a chain.
* **Background jobs with BullMQ.** Salary notifications run in a separate worker process on a Redis queue, so a worker crash can't take down request handling.
* **Tested where it matters.** Jest and Supertest suites cover auth, RBAC edge cases and hierarchy logic. GitHub Actions runs them on every push against real Postgres and Redis service containers.
* **Kubernetes.** Deployed to a local cluster (Docker Desktop) with separate api, worker, postgres and redis workloads. See [Kubernetes Deployment](#kubernetes-deployment).

## Features

* JWT authentication with bcrypt password hashing
* Role based access control (Super Admin, HR Manager, Employee), enforced at route and field level
* Employee CRUD with server side search, filter, sort and pagination
* Self referencing organizational hierarchy with circular reporting prevention
* CSV bulk import with per row error handling
* Dashboard with live aggregated stats
* Salary change notifications processed by a BullMQ worker
* Dark mode (class based theming)
* Automated tests for auth, RBAC and hierarchy logic

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL, Sequelize ORM |
| Queue | Redis, BullMQ |
| Auth | JWT, bcrypt |
| Testing | Jest, Supertest |
| CI | GitHub Actions (Postgres and Redis service containers) |
| Containers | Docker, Docker Compose |
| Orchestration | Kubernetes (local, Docker Desktop) |

## Project Structure

```
ems/
├── .github/workflows/       # CI: tests against Postgres + Redis service containers
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
│   ├── context/             # Auth and Theme context providers
│   ├── lib/                 # API client
│   ├── Dockerfile
│   └── package.json
├── k8s/                     # Kubernetes manifests
├── docker-compose.yml
└── README.md
```

## Prerequisites

* Docker Desktop (includes Docker Compose)
* Git

No local Node.js, npm or PostgreSQL install is needed. Everything runs in containers.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Yashhh0602/Employee-Management-System.git
cd Employee-Management-System
```

### 2. Environment variables

Create a `.env` file inside `backend/` (it is gitignored):

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

`DB_HOST` must be `postgres` (the Docker service name), not `localhost`, because the backend reaches the database over the internal Docker network.

### 3. Build and start all services

```bash
docker compose up --build
```

This starts:

* `postgres`: PostgreSQL (port 5432)
* `backend`: Express API (port 5000)
* `frontend`: Next.js app (port 3000)

Wait until the logs show the backend connected to the database and the frontend ready. The first build can take a few minutes.

### 4. Seed the database (first run only)

```bash
docker exec -it ems-backend-1 npm run seed
```

**Warning:** this drops and recreates all tables (`sequelize.sync({ force: true })`). Only run it on a fresh database.

It creates one account per role for testing RBAC:

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@ems.com | Admin@123 |
| HR Manager | hr@ems.com | Hr@12345 |
| Employee | employee@ems.com | Emp@12345 |

These are local development credentials only. Change them before any real use.

### 5. Open the app

* Frontend: http://localhost:3000/login
* Backend API: http://localhost:5000/api

## Running in the Background

```bash
docker compose up -d        # start detached
docker compose logs -f      # follow logs
docker compose down         # stop everything
```

## Running Tests

```bash
docker exec -it ems-backend-1 npm test
```

The same suites run in GitHub Actions on every push, against Postgres and Redis service containers, with `npm ci` for reproducible installs.

## Troubleshooting

**Port already in use (3000, 5000 or 5432):** find and stop whatever is using it.

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

**Backend can't connect to the database:** make sure `DB_HOST=postgres` in `backend/.env`, not `localhost`.

**Code changes not showing up:** rebuild with `docker compose up --build`.

**Full reset (clears all data):**

```bash
docker compose down -v
docker compose up --build
```

## API Documentation

All endpoints except login need a valid JWT in the `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/auth/login | Public | Authenticate, returns JWT and user info |
| POST | /api/auth/logout | Auth | Invalidate current session |

### Employees

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/employees | Super Admin, HR | List employees with search, filter, sort, pagination |
| GET | /api/employees/:id | Super Admin, HR, Employee (self) | Get one employee |
| POST | /api/employees | Super Admin, HR | Create an employee |
| PUT | /api/employees/:id | Super Admin, HR, Employee (self, limited fields) | Update an employee |
| DELETE | /api/employees/:id | Super Admin only | Delete or deactivate an employee |
| GET | /api/employees/dashboard | Super Admin, HR | Totals, active/inactive, department counts |
| GET | /api/employees/:id/reportees | Super Admin, HR | Direct reports of an employee |

Query parameters for `GET /api/employees`: `search` (name/email), `department`, `role`, `status`, `sortBy` (`name` or `joiningDate`), `order` (`ASC` or `DESC`), `page`, `limit`.

### Organization

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/organization/tree | Super Admin, HR | Full reporting tree |
| PATCH | /api/employees/:id/manager | Super Admin | Reassign a manager (cycle checked) |

Full route definitions and validation rules live in `backend/src/routes/` and `backend/src/validators/`.

## Role Permissions

| Action | Super Admin | HR Manager | Employee |
|---|---|---|---|
| View all employees | ✅ | ✅ | ❌ (self only) |
| Create employee | ✅ | ✅ | ❌ |
| Edit any employee | ✅ | ✅ | ❌ |
| Edit own profile (limited fields) | ✅ | ✅ | ✅ |
| Delete employee | ✅ | ❌ | ❌ |
| Assign roles and managers | ✅ | ❌ | ❌ |
| View organizational tree | ✅ | ✅ | ❌ (own chain only) |

## Kubernetes Deployment

As a learning exercise beyond Docker Compose, the app was also deployed to Kubernetes, tested locally on Docker Desktop's built in cluster, to get hands on with orchestration that Compose doesn't cover.

### Architecture

The manifests in `k8s/` split the app into four independently scaled workloads:

| Component | Kind | Why |
|---|---|---|
| api | Deployment (2 replicas) | Stateless, load balanced through a ClusterIP Service |
| worker | Deployment (1 replica) | Runs the BullMQ salary notification consumer separately from the API, so a crash in one can't take down the other |
| postgres | StatefulSet + PersistentVolumeClaim | Stable network identity and storage that survives pod restarts |
| redis | Deployment | Backing store for the BullMQ queue |

Non secret config (`DB_HOST`, `REDIS_URL`) lives in a ConfigMap and credentials (`DB_PASSWORD`, `JWT_SECRET`) in a Secret, both injected as environment variables. The api Deployment has readiness and liveness probes on `/health`, which gate rolling updates so traffic only reaches pods that are actually ready.

### Running it locally

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
kubectl get pods -n ems -w
```

Once every pod is Running, port forward the API:

```bash
kubectl port-forward -n ems svc/api 5000:80
```

`k8s/secret.yaml` ships with placeholder values. Replace `DB_PASSWORD` and `JWT_SECRET` before applying, or create the Secret directly:

```bash
kubectl create secret generic ems-secret -n ems \
  --from-literal=DB_PASSWORD=your_password \
  --from-literal=JWT_SECRET=your_jwt_secret
```

### What I'd change for a real production cluster

* Run Postgres as a managed database (RDS, Neon, Cloud SQL) instead of in cluster. In cluster state is fine for learning but adds operational risk in production.
* Use a secrets manager (AWS Secrets Manager, Sealed Secrets or External Secrets Operator). Plain Kubernetes Secrets are only base64 encoded and not encrypted at rest by default.
* Add a HorizontalPodAutoscaler on the api Deployment.
* Terminate TLS at an Ingress behind a real domain instead of local port forwarding.

## Deployment Status

The app was previously hosted on Vercel (frontend) and Render (backend and PostgreSQL). That deployment is now offline. To run it, use Docker Compose or the Kubernetes manifests above, or watch the walkthrough video.

## License

MIT. Feel free to use this as a reference.
