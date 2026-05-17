// apps/data-ingestion-service/src/knowledge/dbSchema.ts

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
// Adjust the path if your .env is located elsewhere relative to this file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// --- Constants for our pgvector table ---
export const PGVECTOR_COLLECTION_NAME = process.env.PGVECTOR_COLLECTION_NAME || 'document_chunks';
export const EMBEDDING_DIM = 768; // Gemini's embedding-001 outputs 768 dimensions

// --- PostgreSQL Connection Pool ---
// We'll use environment variables that match your .env and docker-compose.yml
export const pgPool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST || 'db', // 'db' is the service name in docker-compose
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    max: 20, // Max number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // How long to wait for a connection to be established
});

// Event listener for pool errors
pgPool.on('error', (err: Error) => {
    console.error(`[PG Pool Error] Unexpected error on idle client:`, err);
    // process.exit(-1); // Consider exiting the process for critical errors
});

/**
 * Ensures the pgvector extension is enabled and the document_chunks table exists.
 * This can be called at service startup.
 */
export async function ensurePgVectorTableAndIndex(): Promise<void> {
    const client = await pgPool.connect();
    try {
        console.log(`[DB Schema] Ensuring pgvector extension and table '${PGVECTOR_COLLECTION_NAME}' exist...`);

        // 1. Enable pgvector extension (idempotent)
        await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
        console.log('[DB Schema] pgvector extension ensured.');

        // 2. Create the document_chunks table if it doesn't exist
        // This SQL should match your 009_create_document_chunks_table.sql migration
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS ${PGVECTOR_COLLECTION_NAME} (
                id BIGSERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                embedding VECTOR(${EMBEDDING_DIM}),
                building_uuid TEXT,
                building_name TEXT,
                asset_type TEXT,
                time_period DATE,
                time_range TEXT,
                energy_type TEXT,
                source_table TEXT,
                original_row_id TEXT,
                metadata JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await client.query(createTableSql);
        console.log(`[DB Schema] Table '${PGVECTOR_COLLECTION_NAME}' ensured.`);

        // 3. Create the IVFFlat index if it doesn't exist
        const createIndexSql = `
            CREATE INDEX IF NOT EXISTS ${PGVECTOR_COLLECTION_NAME}_embedding_idx
            ON ${PGVECTOR_COLLECTION_NAME} USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
        `;
        await client.query(createIndexSql);
        console.log(`[DB Schema] Index on '${PGVECTOR_COLLECTION_NAME}' ensured.`);

    } catch (error) {
        console.error(`[DB Schema] Error ensuring pgvector table and index:`, error);
        throw error; // Re-throw to indicate a critical startup failure
    } finally {
        client.release();
    }
}

// You might also want a function to close the pool gracefully on shutdown
export async function closePgPool(): Promise<void> {
    console.log('[DB Schema] Closing PostgreSQL connection pool...');
    await pgPool.end();
    console.log('[DB Schema] PostgreSQL connection pool closed.');
}