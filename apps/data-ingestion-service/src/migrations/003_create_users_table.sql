-- =================================================================
-- FILE: apps/data-ingestion-service/src/migrations/003_create_users_table.sql
-- =================================================================

-- We need to enable the 'pgcrypto' extension to use gen_random_uuid().
-- This command will only install it if it doesn't already exist.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a table to store user information for authentication.
CREATE TABLE IF NOT EXISTS users (
  -- Use a UUID for the primary key for better security and scalability.
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The user's full name, retrieved from the identity provider.
  name TEXT,

  -- The user's email address. It must be unique.
  email TEXT NOT NULL UNIQUE,
  
  -- The securely hashed password. Never store plain text!
  password_hash TEXT NOT NULL,
  
  -- The user's role for authorization (e.g., 'admin', 'viewer').
  role TEXT NOT NULL DEFAULT 'viewer',
  
  -- Timestamps for auditing.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add an index on the email column for faster lookups during login.
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
