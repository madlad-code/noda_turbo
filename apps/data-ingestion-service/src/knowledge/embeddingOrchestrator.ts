// apps/data-ingestion-service/src/knowledge/embeddingsOrchestrator.ts

import { fetchBuildings, fetchDailyMetrics, fetchMonthlyMetrics, fetchDashboardData } from './dataFetcher';
import { processDbRowToDocument } from './documentProcessor';
import { storeDocumentsInPgVector } from './vectorStore';
import { DocumentChunk, DbRow } from './types'; // Import necessary types

/**
 * Runs the full RAG knowledge ingestion pipeline from PostgreSQL tables to pgvector.
 * Fetches data, transforms it into documents, generates embeddings, and stores them.
 * @param options Configuration options for the ingestion.
 * - dropExistingVectorStore?: boolean (default: false) - If true, clears the document_chunks table before ingesting. Use with caution.
 * - lastIngestedTimestamp?: string (optional) - For incremental updates, fetches data newer than this timestamp.
 */
export async function runKnowledgeIngestionPipeline(options?: {
    dropExistingVectorStore?: boolean;
    lastIngestedTimestamp?: string; // YYYY-MM-DD or ISO string for timestamps
}): Promise<void> {
    console.log(`[Orchestrator] Starting RAG knowledge ingestion from PostgreSQL at ${new Date().toISOString()}`);

    const { dropExistingVectorStore = false, lastIngestedTimestamp = undefined } = options || {};

    let allDocumentsToIngest: DocumentChunk[] = [];

    try {
        // --- 1. Fetch and Process Data from each Table ---

        // Buildings (usually a full re-fetch as they don't change often, or handled by updates)
        console.log("[Orchestrator] Fetching and processing data from 'buildings' table...");
        const buildingRows = await fetchBuildings();
        for (const row of buildingRows) {
            const doc = await processDbRowToDocument(row, 'buildings', 'buildings_table_fetch');
            if (doc) allDocumentsToIngest.push(doc);
        }
        console.log(`[Orchestrator] Processed ${buildingRows.length} building rows into ${allDocumentsToIngest.filter(d => d.metadata.sourceTable === 'buildings').length} documents.`);


        // Daily Metrics (typically incremental)
        console.log("[Orchestrator] Fetching and processing data from 'daily_metrics' table...");
        const dailyMetricsRows = await fetchDailyMetrics(lastIngestedTimestamp); // Pass timestamp for incremental
        for (const row of dailyMetricsRows) {
            const doc = await processDbRowToDocument(row, 'daily_metrics', 'daily_metrics_table_fetch');
            if (doc) allDocumentsToIngest.push(doc);
        }
        console.log(`[Orchestrator] Processed ${dailyMetricsRows.length} daily metrics rows into ${allDocumentsToIngest.filter(d => d.metadata.sourceTable === 'daily_metrics').length} documents.`);

        // Monthly Metrics (typically incremental)
        console.log("[Orchestrator] Fetching and processing data from 'monthly_metrics' table...");
        const monthlyMetricsRows = await fetchMonthlyMetrics(lastIngestedTimestamp); // Pass timestamp for incremental
        for (const row of monthlyMetricsRows) {
            const doc = await processDbRowToDocument(row, 'monthly_metrics', 'monthly_metrics_table_fetch');
            if (doc) allDocumentsToIngest.push(doc);
        }
        console.log(`[Orchestrator] Processed ${monthlyMetricsRows.length} monthly metrics rows into ${allDocumentsToIngest.filter(d => d.metadata.sourceTable === 'monthly_metrics').length} documents.`);

        // Dashboard Data (can be incremental based on time_period timestamp)
        console.log("[Orchestrator] Fetching and processing data from 'dashboard_data' table...");
        const dashboardDataRows = await fetchDashboardData(lastIngestedTimestamp); // Pass timestamp for incremental
        for (const row of dashboardDataRows) {
            const doc = await processDbRowToDocument(row, 'dashboard_data', 'dashboard_data_table_fetch');
            if (doc) allDocumentsToIngest.push(doc);
        }
        console.log(`[Orchestrator] Processed ${dashboardDataRows.length} dashboard data rows into ${allDocumentsToIngest.filter(d => d.metadata.sourceTable === 'dashboard_data').length} documents.`);

        // --- 2. Check for Documents to Ingest ---
        if (allDocumentsToIngest.length === 0) {
            console.warn("[Orchestrator] No new or existing documents found for ingestion in this run.");
            return; // Exit if nothing to process
        }

        console.log(`[Orchestrator] Total documents prepared for embedding: ${allDocumentsToIngest.length}`);

        // --- 3. Store Documents in PGVector (Embeddings are generated here) ---
        await storeDocumentsInPgVector(allDocumentsToIngest, dropExistingVectorStore);

        console.log(`[Orchestrator] RAG knowledge ingestion completed successfully.`);

    } catch (error) {
        console.error(`[Orchestrator] RAG knowledge ingestion failed:`, error);
        throw error; // Re-throw to be handled by the main service entry point
    }
}