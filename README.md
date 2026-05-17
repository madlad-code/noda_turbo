
# Noda Copilot 

## Project Overview

 This monorepo is designed to provide a robust, scalable, and real-time data visualization platform. It ingests data from local CSV files, stores and processes it using a PostgreSQL database, exposes it via a modern GraphQL API, and visualizes it through a high-performance Next.js dashboard.

The project is structured to ensure clear separation of concerns, independent scaling of services, and a streamlined development workflow.

## Key Features

* **Automated Data Ingestion:** Watches for new/updated CSV files and automatically loads them into PostgreSQL.
* **Centralized Data Storage:** Utilizes PostgreSQL as a reliable and query-optimized data backend.
* **Real-time Data Updates:** Leverages GraphQL Subscriptions to push live data changes to the dashboard.
* **Unified API Layer:** A GraphQL API provides a flexible and strongly-typed interface for all data access.
* **High-Performance Frontend:** A Next.js 15 (App Router) dashboard designed for efficient data fetching and rendering.
* **Monorepo Management:** Uses Turborepo for efficient task running, caching, and dependency management across multiple applications.
* **Comprehensive Documentation:** Dedicated documentation site to guide developers and users.

## Architecture

The project follows a microservices-like architecture within a monorepo setup:


![Architecture Diagram](./architecture.png)


## Technologies Used

* **Monorepo Tooling:** [Turborepo](https://turbo.build/) (for build orchestration), [PNPM Workspaces](https://pnpm.io/workspaces) (for dependency management)
* **Frontend:** [Next.js 15](https://nextjs.org/) (App Router, React), [Apollo Client](https://www.apollographql.com/docs/react/), [Recharts](https://recharts.org/), [D3.js](https://d3js.org/), [Tailwind CSS](https://tailwindcss.com/), [Zustand](https://zustand-zustand.vercel.app/)
* **Backend (API):** [Node.js](https://nodejs.org/), [Apollo Server](https://www.apollographql.com/docs/apollo-server/), [GraphQL Subscriptions](https://www.apollographql.com/docs/apollo-server/data/subscriptions/)
* **Database:** [PostgreSQL](https://www.postgresql.org/)
* **Real-time Messaging:** [Redis](https://redis.io/) (used as a PubSub broker)
* **Data Ingestion:** Node.js, `chokidar`, `csv-parser`, `pg`, `pg-copy-streams`
* **Containerization:** [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)

## Getting Started (Local Development)

### Prerequisites

* [Node.js](https://nodejs.org/en/download/) (v20 or higher recommended)
* [pnpm](https://pnpm.io/installation) (v8 or higher recommended)
* [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.
* Git

### 1. Clone the Repository

```bash
git clone [https://github.com/thedhinakarr/noda_turbo.git](https://github.com/thedhinakarr/noda_turbo.git) # Replace with your repo URL
cd noda_turbo
```

### 2. Install Monorepo Dependencies

This will install all dependencies for all `apps/` and `packages/` workspaces.

```bash
pnpm install
```

### 3. Configure Environment Variables

Create your local environment file by copying the example:

```bash
cp .env.example .env
```

Review and adjust the variables in `.env` as needed. The `PG_HOST` for host-side services should be `localhost`.

### 4. Set up Dockerized Infrastructure

This will bring up your PostgreSQL database and Redis server.

```bash
docker-compose up -d db redis
```

Verify they are running: `docker-compose ps`

### 5. Initialize PostgreSQL Schema

Run the initial database migration to create the `dashboard_data` table:

```bash
cat apps/data-ingestion-service/src/migrations/001_create_dashboard_data_table.sql | docker exec -i noda_turbo_postgres psql -U noda_user -d noda_turbo_db
```
Enter `noda_password` when prompted.

You can verify the table exists:
`docker exec -it noda_turbo_postgres psql -U noda_user -d noda_turbo_db -c "\dt"`

### 6. Run the Data Ingestion Service (Host-side for now)

Due to persistent Docker build challenges with this specific service, we will run the `data-ingestion-service` directly on your host machine for development.

First, adjust its `.env` for host-side connection to Dockerized DB:
Open `apps/data-ingestion-service/.env` and ensure `PG_HOST` is `localhost`.

```bash
# From noda_turbo/ root
cd apps/data-ingestion-service
pnpm run build # Compile TypeScript
pnpm run start # Start the service
```
Keep this terminal open. You should see logs indicating a successful PostgreSQL connection and folder watching.

#### Test Data Ingestion:

Open a **new terminal**, navigate to `apps/data-ingestion-service/`, and copy your example CSV:

```bash
cp ../../apps/web/data/retrospect_1_0_3_example\ -\ Sheet1.csv ./data/incoming/
```
Check the `data-ingestion-service` terminal for logs confirming processing and loading. Verify in `psql` (`SELECT count(*) FROM dashboard_data;`).

### 7. Run the GraphQL API (To Be Implemented)

Instructions for building and running the `graphql-api` will go here once implemented. It will likely be Dockerized.

### 8. Run the Next.js Frontend (Dashboard App)

```bash
# From noda_turbo/ root
cd apps/dashboard-frontend # (or apps/web, if not renamed yet)
pnpm run dev
```
The dashboard app will initially serve with mock data or empty state until the GraphQL API is connected.

### 9. Run the Documentation Site

```bash
# From noda_turbo/ root
cd apps/docs
pnpm run dev
```

## Development Workflow

* **Code Changes:** Make changes within the respective `apps/` or `packages/` directories.
* **Shared Dependencies:** If you modify a `packages/` dependency, ensure you run `pnpm install` from the monorepo root to update symlinks/lockfile if needed.
* **API/Ingestion Changes:** For `graphql-api` (once implemented) and `data-ingestion-service` (host-side), restart the respective `pnpm run dev`/`pnpm run start` commands.
* **Frontend Changes:** Next.js development server provides hot-reloading.


