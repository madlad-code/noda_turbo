
#  Noda Turbo Data Ingestion Service

This Node.js application is the automated data ingestion pipeline for the Noda Turbo Dashboard project. It watches a designated folder for new or updated CSV files, processes them, and loads the data into the PostgreSQL database.

## Overview

The service ensures that data from physical CSV files is reliably and automatically transferred into the structured database, making it available for the GraphQL API and the dashboard. It's designed to run continuously in the background, keeping the dashboard data up-to-date.

## Features

* **Automated File Watching:** Monitors a specified "incoming" directory for `.csv` files.
* **CSV Parsing & Transformation:** Reads CSV content, converts data types (e.g., strings to numbers/dates), and maps columns to the PostgreSQL `dashboard_data` table schema.
* **Robust Data Loading:** Utilizes `pg-copy-streams` for efficient bulk insertion into PostgreSQL.
* **File Management:** Moves processed CSVs to a `processed/` archive and erroneous files to an `errors/` directory.
* **PostgreSQL Notification:** Triggers a `pg_notify` event in PostgreSQL after successful data loads, signaling to the GraphQL API that new data is available for real-time updates.

## Technologies Used

* [Node.js](https://nodejs.org/)
* `chokidar` (for file system watching)
* `csv-parser` (for CSV parsing)
* `pg` (Node.js PostgreSQL client)
* `pg-copy-streams` (for high-performance bulk data loading)
* `dotenv` (for environment variable management)
* [TypeScript](https://www.typescriptlang.org/)

## Getting Started

Make sure you have followed the [Monorepo Root README](../../README.md) for overall setup, including installing `pnpm` and Docker Compose, and setting up your PostgreSQL database.

### 1. Install Dependencies (from Monorepo Root)

Ensure all monorepo dependencies are installed:

```bash
# From noda_turbo/ root
pnpm install
```

### 2\. Configure Environment Variables

Create a local `.env` file for your ingestion service. **Crucially, adjust `PG_HOST` to `localhost` for host-side execution.**

```bash
# From apps/data-ingestion-service/
cp .env.example .env
```

Update `.env` with your PostgreSQL connection details and the paths for your CSV directories:

```dotenv
# apps/data-ingestion-service/.env

# --- PostgreSQL Configuration (For host-side connection to Dockerized DB) ---
PG_HOST=localhost # IMPORTANT: Change from 'db' to 'localhost' for host-side execution
PG_PORT=5432
PG_DATABASE=noda_turbo_db
PG_USER=noda_user
PG_PASSWORD=noda_password

# --- CSV Ingestion Configuration ---
CSV_INCOMING_DIR=./data/incoming   # Relative path within apps/data-ingestion-service
CSV_PROCESSED_DIR=./data/processed
CSV_ERROR_DIR=./data/errors
```

### 3\. Prepare Data Directories

Ensure the input and output directories for CSVs exist:

```bash
# From apps/data-ingestion-service/
mkdir -p data/incoming
mkdir -p data/processed
mkdir -p data/errors
```

### 4\. Run the Data Ingestion Service (Host-side for Development)

During development, we recommend running this service directly on your host machine to bypass Docker build complexities.

```bash
# From apps/data-ingestion-service/
pnpm run build # Compile TypeScript
pnpm run start # Start the service
```

Keep this terminal open to observe logs. It should connect to PostgreSQL and start watching the `data/incoming` folder.

## Data Flow & Integration

1.  **File Drop:** You place new/updated CSV files into `apps/data-ingestion-service/data/incoming/` on your host.
2.  **Watcher Detection:** The `chokidar` watcher immediately detects the file.
3.  **Processing:** The service parses and transforms CSV rows into the `DashboardDataRow` format.
4.  **Database Load:** Data is bulk-inserted into the `dashboard_data` table in PostgreSQL.
5.  **Real-time Trigger:** PostgreSQL database triggers fire `pg_notify` events, informing the GraphQL API of new data.
6.  **File Management:** The processed CSV is moved to `data/processed/` (or `data/errors/` if an issue occurred).

## Project Structure

```
data-ingestion-service/
├── src/
│   ├── config/             # Environment variable loading
│   ├── csv-processor/      # Logic to parse and transform CSVs
│   ├── db-loader/          # Logic for bulk loading into PostgreSQL
│   ├── watcher/            # chokidar setup and file event handling
│   ├── utils/              # Helper functions
│   ├── migrations/         # Database schema management (SQL files)
│   └── index.ts            # Main entry point for the ingestion service
├── data/                   # Directories for CSVs
│   ├── incoming/
│   ├── processed/
│   └── errors/
├── package.json            # Project dependencies
├── Dockerfile              # Dockerfile for containerization (for future deployment)
├── tsconfig.json           # TypeScript configuration
└── .env.example            # Example environment file
└── README.md               # This file
```
