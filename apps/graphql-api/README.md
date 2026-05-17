
# Noda Turbo GraphQL API

This is the central GraphQL API service for the Noda Turbo Dashboard project. It acts as a unified data layer, abstracting the underlying data sources (PostgreSQL for processed CSV data, Redis for real-time PubSub) and providing a flexible, strongly-typed interface for the frontend.

## Overview

Built with Apollo Server, this API handles all data requests (queries, mutations) and real-time updates (subscriptions) from the frontend. It's designed for scalability and maintainability, ensuring a single, consistent entry point for data access regardless of the backend complexity.

## Features

* **Unified Data Graph:** Exposes a single GraphQL endpoint to combine data from various sources.
* **PostgreSQL Integration:** Fetches historical and processed data from the `dashboard_data` table in PostgreSQL.
* **Real-time Subscriptions:** Leverages Redis as a PubSub broker to push live data updates to connected clients via GraphQL Subscriptions.
* **Schema-First Development:** Defines a clear GraphQL schema (`schema/index.graphql`) that acts as a contract with the frontend.
* **Optimized Data Fetching:** Utilizes `DataLoader` (to be implemented) for efficient batching and caching of database requests, preventing N+1 problems.
* **Scalability:** Designed to be horizontally scalable, with Redis managing real-time events across multiple API instances.

## Technologies Used

* [Node.js](https://nodejs.org/)
* [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
* [GraphQL.js](https://graphql.org/graphql-js/)
* [PostgreSQL (pg)](https://node-postgres.com/)
* [Redis (graphql-redis-subscriptions)](https://github.com/davidyaha/graphql-redis-subscriptions)
* [TypeScript](https://www.typescriptlang.org/)
* [Dotenv](https://github.com/motdotla/dotenv)
* [DataLoader](https://github.com/graphql/dataloader) (to be implemented)
* Shared packages from `@repo/` (ESLint, TypeScript configs, GraphQL types)

## Getting Started

Make sure you have followed the [Monorepo Root README](../../README.md) for overall setup, including installing `pnpm` and Docker Compose.

### 1. Install Dependencies (from Monorepo Root)

Ensure all monorepo dependencies are installed:

```bash
# From noda_turbo/ root
pnpm install
```

### 2\. Configure Environment Variables

Create a local `.env` file for your GraphQL API:

```bash
# From apps/graphql-api/
cp .env.example .env
```

Update `.env` with your PostgreSQL and Redis connection details. Ensure these match your `docker-compose.yml` configuration:

```dotenv
# apps/graphql-api/.env

# --- PostgreSQL Configuration ---
PG_HOST=db       # 'db' is the service name in docker-compose
PG_PORT=5432
PG_DATABASE=noda_turbo_db
PG_USER=noda_user
PG_PASSWORD=noda_password

# --- Redis Configuration ---
REDIS_HOST=redis # 'redis' is the service name in docker-compose
REDIS_PORT=6379

# --- API Configuration ---
GRAPHQL_API_PORT=4000 # Default port for Apollo Server
```

### 3\. Run the Development Server (To Be Implemented)

Once implemented, you'll run this service via Docker Compose.

```bash
# From noda_turbo/ root (after adding graphql-api to docker-compose.yml)
docker-compose up -d graphql-api # Or just `docker-compose up -d` for all services
# Verify with: docker-compose logs -f graphql-api
```

## API Endpoints

  * **GraphQL HTTP Endpoint:** `http://localhost:4000/graphql` (for Queries and Mutations)
  * **GraphQL WebSocket Endpoint:** `ws://localhost:4000/graphql` (for Subscriptions)

## Project Structure

```
graphql-api/
├── src/
│   ├── config/             # Environment variable loading, general server config
│   ├── schema/             # GraphQL Schema Definition Language (SDL) files (e.g., index.graphql)
│   ├── resolvers/          # GraphQL Resolver implementations
│   │   ├── csvData.ts      # Resolvers for processed CSV data
│   │   └── subscriptions.ts # Resolvers for real-time subscriptions
│   ├── datasources/        # Classes to abstract data access (e.g., PostgreSQL interactions)
│   ├── db/                 # PostgreSQL connection/pool setup
│   ├── pubsub/             # PubSub setup (e.g., Redis pubsub instance)
│   ├── index.ts            # Main Apollo Server entry point and WebSocket setup
│   └── context.ts          # Context function for authentication/authorization
├── package.json            # Project dependencies
├── Dockerfile              # Dockerfile for containerizing the API
├── tsconfig.json           # TypeScript configuration
└── .env.example            # Example environment file
└── README.md               # This file
```

## Data Flow & Real-time

1.  **Ingestion Service** loads data into **PostgreSQL**.
2.  **PostgreSQL** triggers `pg_notify` on data changes.
3.  The **GraphQL API** `LISTEN`s for `pg_notify` events.
4.  Upon receiving an event, the **GraphQL API** `PUBLISH`es data to **Redis** (PubSub).
5.  **Apollo Server Subscriptions** push updates from Redis to subscribed **Next.js Frontend** clients via WebSockets.

