import pool from './db';
import { Request } from 'express';
import * as jose from 'jose';
import DataLoader from 'dataloader';
import { Pool } from 'pg';

// =================================================================
// DataLoader Implementation
// =================================================================

// Define a generic type for the metric records returned from the database.
type MetricRecord = { [key: string]: any; building_uuid?: string; uuid?: string };

/**
 * A higher-order function that creates a batch-loading function for a specific table.
 * This function is the core of our N+1 solution.
 * @param db The database pool connection.
 * @param table The table to query ('dashboard_data' or 'daily_metrics').
 * @returns An async function that DataLoader can use to batch requests.
 */
const createBatchFn = (db: Pool, table: string) => async (uuids: readonly string[]): Promise<(MetricRecord | Error)[]> => {
    const uuidColumn = table === 'dashboard_data' ? 'uuid' : 'building_uuid';

    // This powerful PostgreSQL query fetches only the most recent row for each UUID in the provided list.
    const query = `
        SELECT * FROM (
            SELECT DISTINCT ON (${uuidColumn}) *
            FROM ${table}
            WHERE ${uuidColumn} = ANY($1::text[])
            ORDER BY ${uuidColumn}, time_period DESC
        ) t
    `;

    try {
        const result = await db.query(query, [uuids]);
        const recordsByUuid = new Map<string, MetricRecord>();

        // Group the results by their UUID for easy lookup.
        result.rows.forEach(row => {
            recordsByUuid.set(row[uuidColumn], row);
        });

        // Map the results back to the original order of UUIDs.
        // DataLoader requires the output array to be the same size and order as the input array.
        return uuids.map(uuid => recordsByUuid.get(uuid) || new Error(`No record found for UUID: ${uuid}`));
    } catch (error) {
        console.error(`Error batch fetching from ${table}:`, error);
        return uuids.map(() => new Error('Database query failed'));
    }
};

/**
 * A factory function that creates all the necessary DataLoader instances for a single request.
 * @param db The database pool connection.
 */
export const createLoaders = (db: Pool) => {
    return {
        // A loader for the latest metrics from the granular dashboard_data table.
        latestGranularMetric: new DataLoader<string, MetricRecord>(createBatchFn(db, 'dashboard_data')),
        // A loader for the latest metrics from the daily_metrics table.
        latestDailyMetric: new DataLoader<string, MetricRecord>(createBatchFn(db, 'daily_metrics')),
    };
};

export type AppDataLoaders = ReturnType<typeof createLoaders>;


// =================================================================
// Context Implementation
// =================================================================

// --- SETUP ---
// NOTE: These are not needed for unauthenticated testing but are kept for when you re-enable auth.
const CLIENT_ID = process.env.AUTH_MICROSOFT_ENTRA_ID_ID;
// if (!CLIENT_ID) {
//   throw new Error("CRITICAL: Missing Azure AD environment variable: AUTH_MICROSOFT_ENTRA_ID_ID");
// }
const jwksUri = `https://login.microsoftonline.com/common/discovery/v2.0/keys`;
const JWKS = jose.createRemoteJWKSet(new URL(jwksUri));

// --- INTERFACES ---
export interface UserPayload {
  oid: string;
  preferred_username?: string;
  name?: string;
  roles?: string[];
  tid: string;
}

export interface MyContext {
  db: typeof pool;
  user?: UserPayload;
  loaders: AppDataLoaders; // DataLoaders are now part of the context.
}

// --- CONTEXT FACTORY ---
export const createContext = async ({ req }: { req: Request }): Promise<MyContext> => {
  const loaders = createLoaders(pool);

  // =================================================================
  // TEMPORARY: Authentication Disabled for Testing
  // =================================================================
  // We are creating a mock user object and attaching it to the context.
  // This will bypass the authentication checks in the resolvers.
  const mockUser: UserPayload = {
      oid: '00000000-0000-0000-0000-000000000000', // A dummy user ID
      name: 'Test User',
      preferred_username: 'test@noda.se',
      roles: ['admin'],
      tid: '00000000-0000-0000-0000-000000000000' // A dummy tenant ID
  };

  console.warn("**************************************************");
  console.warn("**** AUTHENTICATION IS CURRENTLY DISABLED    ****");
  console.warn("**************************************************");

  return { db: pool, loaders, user: mockUser };
  // =================================================================
  // END OF TEMPORARY CODE
  // =================================================================


  /*
  // =================================================================
  // ORIGINAL AUTHENTICATION LOGIC (Commented out for testing)
  // =================================================================
  const baseContext = { db: pool, loaders };

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return baseContext;
  }

  const token = authHeader.substring(7);

  try {
    const { payload } = await jose.jwtVerify(token, JWKS, { audience: CLIENT_ID! });
    const userOid = payload.oid as string;
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userOid]);
    let userInDb = userResult.rows[0];

    if (!userInDb) {
      console.log(`User with OID ${userOid} not found. Creating new user...`);
      const userFullName = payload.name || payload.preferred_username;
      const newUserResult = await pool.query(
        'INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
        [userOid, userFullName, payload.preferred_username, 'SSO_USER']
      );
      userInDb = newUserResult.rows[0];
    }
    
    return { ...baseContext, user: userInDb };

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in createContext:', error.message);
    } else {
      console.error('An unknown error occurred in createContext.');
    }
    return baseContext;
  }
  // =================================================================
  */
};