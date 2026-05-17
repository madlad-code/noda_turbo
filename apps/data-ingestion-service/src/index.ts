// apps/data-ingestion-service/src/index.ts

import dotenv from 'dotenv';
import path from 'path';
import { DatabaseService } from './db';
import { IngestionService } from './ingestion';

// --- NEW IMPORTS FOR RAG KNOWLEDGE ---
import { ensurePgVectorTableAndIndex, pgPool, closePgPool } from './knowledge/dbSchema';
// import { runKnowledgeIngestionPipeline } from './knowledge/embeddingsOrchestrator';
// FIX: Update the import path if the file exists with a different name or location
// Example: If the file is named 'embeddingOrchestrator.ts' (note the missing 's'), use:
import { runKnowledgeIngestionPipeline } from './knowledge/embeddingOrchestrator';
// If the file does not exist, create './knowledge/embeddingOrchestrator.ts' and export 'runKnowledgeIngestionPipeline' from it.
// -------------------------------------

// Load environment variables from the root .env file.
// Adjust this path if your .env is located elsewhere relative to this file.
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

let databaseService: DatabaseService;

async function main() {
    console.log(`[Main Service] Starting NODA Data Ingestion Service at ${new Date().toISOString()}`);

    databaseService = new DatabaseService();

    try {
        // --- EXISTING DATABASE INITIALIZATION ---
        await databaseService.initialize();
        console.log('[Main Service] Main Database initialization complete.');
        // ----------------------------------------

        // --- NEW RAG KNOWLEDGE INGESTION STARTUP ---
        // Ensure the pgvector table and index are set up for our RAG knowledge base.
        // This is safe to run on every startup (due to IF NOT EXISTS in SQL in dbSchema.ts).
        await ensurePgVectorTableAndIndex();
        console.log('[Main Service] RAG knowledge database schema verified.');

        // Run the RAG knowledge ingestion pipeline.
        // This will fetch data from your existing application tables, process, embed, and store it.
        //
        // IMPORTANT:
        // - Set 'dropExistingVectorStore: true' for initial full rebuilds (e.g., in development or if you want to reset all RAG data).
        //   It will DELETE all existing rows in the 'document_chunks' table before inserting.
        // - Set 'dropExistingVectorStore: false' for production / incremental updates.
        //   If false, you'll need to implement a strategy to pass 'lastIngestedTimestamp' to only process new data.
        runKnowledgeIngestionPipeline({
            dropExistingVectorStore: true, // <<< SET THIS TO `false` FOR PRODUCTION/INCREMENTAL RUNS!
            // lastIngestedTimestamp: '2025-06-01T00:00:00Z', // Example for incremental fetching (ISO string)
        }).catch(error => {
            // The .catch() allows the main service to continue even if RAG ingestion fails.
            // If RAG ingestion is critical for your service, you would 'await' it and 'process.exit(1)' on failure.
            console.error("[Main Service] RAG knowledge ingestion pipeline failed with error:", error);
        });
        // ------------------------------------------

        // --- EXISTING INGESTION SERVICE STARTUP ---
        // Pass the single database instance to the IngestionService
        const ingestionService = new IngestionService(databaseService);
        ingestionService.start();
        // ------------------------------------------

    } catch (error) {
        console.error("[Main Service] An unhandled critical error occurred during service startup:", error);
        // --- NEW: Ensure both database pools are disconnected on critical startup failure ---
        await databaseService.disconnect(); // Disconnect your main DB service
        await closePgPool(); // Close the RAG specific pgPool
        // ---------------------------------------------------------------------------------
        process.exit(1); // Exit with an error code to indicate failure
    }
}

// --- NEW: Handle graceful shutdown signals to close both DB pools ---
process.on('SIGINT', async () => {
    console.log('[Main Service] SIGINT received. Shutting down gracefully...');
    await databaseService.disconnect(); // Disconnect your main DB service
    await closePgPool(); // Close the RAG specific pgPool
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('[Main Service] SIGTERM received. Shutting down gracefully...');
    await databaseService.disconnect(); // Disconnect your main DB service
    await closePgPool(); // Close the RAG specific pgPool
    process.exit(0);
});
// -----------------------------------------------------------------

// Start the main application function
main();