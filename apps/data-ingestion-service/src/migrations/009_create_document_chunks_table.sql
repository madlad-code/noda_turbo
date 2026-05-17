-- apps/data-ingestion-service/src/migrations/009_create_document_chunks_table.sql

-- Ensure the pgvector extension is enabled (idempotent, harmless if already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the document_chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,                  -- The actual text chunk
    embedding VECTOR(768),                  -- For Gemini's embedding-001, which outputs 768 dimensions
    building_uuid TEXT,                     -- Identifier from buildings
    building_name TEXT,
    asset_type TEXT,
    time_period DATE,                       -- For daily/monthly metrics (YYYY-MM-DD)
    time_range TEXT,                        -- For dashboard data (e.g., 'Last 30 Days')
    energy_type TEXT,                       -- For dashboard data (e.g., 'Electricity')
    source_table TEXT,                      -- e.g., 'buildings', 'daily_metrics'
    original_row_id TEXT,                   -- Unique ID from the original source row
    metadata JSONB,                         -- Flexible JSON for additional metadata (e.g., specific metric values not in content)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- When this embedding was created
);

-- Create an IVFFlat index for efficient approximate nearest neighbor search
-- 'lists' parameter: 100 is a good starting point for smaller datasets.
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON document_chunks USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);