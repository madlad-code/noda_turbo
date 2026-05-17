// apps/data-ingestion-service/src/knowledge/vectorStore.ts

import { PoolClient } from 'pg'; // Corrected: Only PoolClient is needed here
import { pgPool, PGVECTOR_COLLECTION_NAME } from './dbSchema'; // Re-use the pool and table name
import { DocumentChunk } from './types'; // Import our DocumentChunk type
import { getGeminiEmbeddings } from './embeddings'; // Import our Gemini embedding function

const INSERT_BATCH_SIZE = 500; // Number of documents to insert in one SQL query batch

/**
 * Inserts a batch of DocumentChunks (with their pre-generated embeddings) into the pgvector table.
 * Uses parameterized queries for safety.
 * @param documents The DocumentChunk objects for this batch.
 * @param embeddings The corresponding embeddings (number[][]) for the documents in this batch.
 * @param client A PostgreSQL PoolClient (acquired from the pool).
 */
async function insertDocumentBatch(documents: DocumentChunk[], embeddings: number[][], client: PoolClient): Promise<void> {
    if (documents.length === 0) {
        return;
    }

    if (documents.length !== embeddings.length) {
        console.error("[VectorStore] Mismatch between number of documents and embeddings provided for batch insert.");
        throw new Error("Mismatch between number of documents and embeddings provided for batch insert.");
    }

    const valuesPlaceholders: string[] = [];
    const queryParams: (string | number | boolean | null)[] = []; // Broadened type for safety

    let paramCounter = 1;
    documents.forEach((doc, idx) => {
        const embeddingVector = embeddings[idx] ? `[${embeddings[idx].join(',')}]` : '[]'; // Format vector for PG SQL, fallback to empty vector if undefined

        valuesPlaceholders.push(`(
            $${paramCounter++}, $${paramCounter++}::vector, $${paramCounter++}, $${paramCounter++}, $${paramCounter++},
            $${paramCounter++}::date, $${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++}::jsonb,
            CURRENT_TIMESTAMP
        )`);

        // Collect parameters in order.
        // All values are passed as query parameters ($X syntax), which pg handles for escaping.
        queryParams.push(
            doc.pageContent,
            embeddingVector,
            doc.metadata.buildingUuid || null,
            doc.metadata.buildingName || null,
            doc.metadata.assetType || null,
            doc.metadata.timePeriod || null,
            doc.metadata.timeRange || null,
            doc.metadata.energyType || null,
            doc.metadata.sourceTable || null,
            String(doc.metadata.originalRowId) || null,
            JSON.stringify(doc.metadata)
        );
    });

    const insertSql = `
    INSERT INTO "${PGVECTOR_COLLECTION_NAME}" (
        content, embedding, building_uuid, building_name, asset_type,
        time_period, time_range, energy_type, source_table, original_row_id, metadata, created_at
    ) VALUES ${valuesPlaceholders.join(',')};
    `;

    try {
        await client.query(insertSql, queryParams);
    } catch (error) {
        console.error(`[VectorStore] Error inserting batch into "${PGVECTOR_COLLECTION_NAME}":`, error);
        throw error;
    }
}

/**
 * Main function to orchestrate getting embeddings and storing documents in PGVector.
 * @param documents A list of DocumentChunk objects that were generated from DB rows.
 * @param dropExisting If true, deletes all existing records from the table before inserting. Use with extreme caution!
 */
export async function storeDocumentsInPgVector(documents: DocumentChunk[], dropExisting: boolean = false): Promise<void> {
    let client: PoolClient | undefined; // Corrected: Type is PoolClient | undefined
    try {
        client = await pgPool.connect(); // Acquire a client from the pool

        if (dropExisting) {
            console.log(`[VectorStore] Deleting all existing data from "${PGVECTOR_COLLECTION_NAME}" table.`);
            await client.query(`DELETE FROM "${PGVECTOR_COLLECTION_NAME}";`);
            console.log("[VectorStore] Existing data cleared.");
        }

        if (documents.length === 0) {
            console.log("[VectorStore] No documents to store.");
            return;
        }

        console.log(`[VectorStore] Starting embedding and batch insertion for ${documents.length} documents.`);

        // 1. Get embeddings for all document contents
        const contentsToEmbed = documents.map(doc => doc.pageContent);
        const allEmbeddings = await getGeminiEmbeddings(contentsToEmbed);

        if (allEmbeddings.length !== documents.length) {
            console.error("[VectorStore] Mismatch in count: documents and generated embeddings. Aborting.");
            throw new Error("Embedding generation failed for some documents.");
        }

        // 2. Insert documents in batches
        for (let i = 0; i < documents.length; i += INSERT_BATCH_SIZE) {
            const batchDocs = documents.slice(i, i + INSERT_BATCH_SIZE);
            const batchEmbeddings = allEmbeddings.slice(i, i + INSERT_BATCH_SIZE);

            // CORRECTED: Use INSERT_BATCH_SIZE instead of BATCH_SIZE
            console.log(`[VectorStore] Inserting batch ${Math.floor(i / INSERT_BATCH_SIZE) + 1}/${Math.ceil(documents.length / INSERT_BATCH_SIZE)} (${batchDocs.length} docs)...`);
            await insertDocumentBatch(batchDocs, batchEmbeddings, client);
        }

        console.log(`[VectorStore] Successfully stored ${documents.length} documents in "${PGVECTOR_COLLECTION_NAME}".`);

    } catch (error) {
        console.error("[VectorStore] Failed to store documents in PGVector:", error);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
}