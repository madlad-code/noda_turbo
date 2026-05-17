// apps/data-ingestion-service/src/knowledge/dataFetcher.ts

import { PoolClient } from 'pg'; // Use PoolClient for managed connections
import { pgPool } from './dbSchema'; // Import the shared PostgreSQL pool
import { DbRow } from './types'; // Import the generic DbRow type

/**
 * Fetches building data from the 'buildings' table.
 * @param client Optional: A pg.PoolClient to use for the query (for transactions/reusing client).
 * @returns A Promise resolving to an array of raw building row objects.
 */
export async function fetchBuildings(client?: PoolClient): Promise<DbRow[]> {
    let actualClient = client;
    if (!actualClient) {
        actualClient = await pgPool.connect(); // Acquire client from pool if not provided
    }
    try {
        console.log("[DataFetcher] Fetching data from 'buildings' table...");
        const result = await actualClient.query('SELECT * FROM buildings;');
        console.log(`[DataFetcher] Fetched ${result.rows.length} rows from 'buildings'.`);
        // --- DEBUG LOGGING ---
        console.log("[DataFetcher] First 3 rows from 'buildings':", JSON.stringify(result.rows.slice(0, 3), null, 2));
        // ---------------------
        return result.rows;
    } catch (error) {
        console.error("[DataFetcher] Error fetching from 'buildings' table:", error);
        throw error;
    } finally {
        if (!client && actualClient) { // Only release if we acquired the client in this function
            actualClient.release();
        }
    }
}

/**
 * Fetches daily metrics data from the 'daily_metrics' table.
 * @param lastIngestedDate Optional: Only fetch data newer than this date (YYYY-MM-DD string).
 * @param client Optional: A pg.PoolClient to use.
 * @returns A Promise resolving to an array of raw daily_metrics row objects.
 */
export async function fetchDailyMetrics(lastIngestedDate?: string, client?: PoolClient): Promise<DbRow[]> {
    let actualClient = client;
    if (!actualClient) {
        actualClient = await pgPool.connect();
    }
    try {
        console.log("[DataFetcher] Fetching data from 'daily_metrics' table...");
        let query = 'SELECT * FROM daily_metrics';
        const params: any[] = [];
        if (lastIngestedDate) {
            query += ' WHERE time_period > $1';
            params.push(lastIngestedDate);
            console.log(`[DataFetcher] (Incremental) Fetching daily metrics newer than ${lastIngestedDate}.`);
        }
        query += ' ORDER BY time_period ASC;'; // Order for consistent processing
        const result = await actualClient.query(query, params);
        console.log(`[DataFetcher] Fetched ${result.rows.length} rows from 'daily_metrics'.`);
        // --- DEBUG LOGGING ---
        console.log("[DataFetcher] First 3 rows from 'daily_metrics':", JSON.stringify(result.rows.slice(0, 3), null, 2));
        // ---------------------
        return result.rows;
    } catch (error) {
        console.error("[DataFetcher] Error fetching from 'daily_metrics' table:", error);
        throw error;
    } finally {
        if (!client && actualClient) {
            actualClient.release();
        }
    }
}

/**
 * Fetches monthly metrics data from the 'monthly_metrics' table.
 * @param lastIngestedDate Optional: Only fetch data newer than this date (YYYY-MM-DD string).
 * @param client Optional: A pg.PoolClient to use.
 * @returns A Promise resolving to an array of raw monthly_metrics row objects.
 */
export async function fetchMonthlyMetrics(lastIngestedDate?: string, client?: PoolClient): Promise<DbRow[]> {
    let actualClient = client;
    if (!actualClient) {
        actualClient = await pgPool.connect();
    }
    try {
        console.log("[DataFetcher] Fetching data from 'monthly_metrics' table...");
        let query = 'SELECT * FROM monthly_metrics';
        const params: any[] = [];
        if (lastIngestedDate) {
            query += ' WHERE time_period > $1';
            params.push(lastIngestedDate);
            console.log(`[DataFetcher] (Incremental) Fetching monthly metrics newer than ${lastIngestedDate}.`);
        }
        query += ' ORDER BY time_period ASC;'; // Order for consistent processing
        const result = await actualClient.query(query, params);
        console.log(`[DataFetcher] Fetched ${result.rows.length} rows from 'monthly_metrics'.`);
        // --- DEBUG LOGGING ---
        console.log("[DataFetcher] First 3 rows from 'monthly_metrics':", JSON.stringify(result.rows.slice(0, 3), null, 2));
        // ---------------------
        return result.rows;
    } catch (error) {
        console.error("[DataFetcher] Error fetching from 'monthly_metrics' table:", error);
        throw error;
    } finally {
        if (!client && actualClient) {
            actualClient.release();
        }
    }
}

/**
 * Fetches dashboard data from the 'dashboard_data' table.
 * @param lastIngestedTimestamp Optional: Only fetch data newer than this timestamp (ISO string).
 * @param client Optional: A pg.PoolClient to use.
 * @returns A Promise resolving to an array of raw dashboard_data row objects.
 */
export async function fetchDashboardData(lastIngestedTimestamp?: string, client?: PoolClient): Promise<DbRow[]> {
    let actualClient = client;
    if (!actualClient) {
        actualClient = await pgPool.connect();
    }
    try {
        console.log("[DataFetcher] Fetching data from 'dashboard_data' table...");
        let query = 'SELECT * FROM dashboard_data';
        const params: any[] = [];
        if (lastIngestedTimestamp) {
            query += ' WHERE time_period > $1'; // Assuming time_period is a timestamp column
            params.push(lastIngestedTimestamp);
            console.log(`[DataFetcher] (Incremental) Fetching dashboard data newer than ${lastIngestedTimestamp}.`);
        }
        query += ' ORDER BY time_period ASC;'; // Order for consistent processing
        const result = await actualClient.query(query, params);
        console.log(`[DataFetcher] Fetched ${result.rows.length} rows from 'dashboard_data'.`);
        // --- DEBUG LOGGING ---
        console.log("[DataFetcher] First 3 rows from 'dashboard_data':", JSON.stringify(result.rows.slice(0, 3), null, 2));
        // ---------------------
        return result.rows;
    } catch (error) {
        console.error("[DataFetcher] Error fetching from 'dashboard_data' table:", error);
        throw error;
    } finally {
        if (!client && actualClient) {
            actualClient.release();
        }
    }
}