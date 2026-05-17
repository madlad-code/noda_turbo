// apps/data-ingestion-service/src/knowledge/embeddings.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
// Adjust the path if your .env is located elsewhere relative to this file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const GOOGLE_API_KEY = process.env.GEMINI_API_KEY; // Use GEMINI_API_KEY as per your .env
if (!GOOGLE_API_KEY) {
    console.error("Error: GEMINI_API_KEY environment variable is not set for Gemini Embeddings.");
    process.exit(1); // Exit if critical API key is missing
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const EMBEDDING_MODEL_NAME = "text-embedding-004"; // Consistent with DB schema
const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL_NAME });

const EMBEDDING_BATCH_SIZE = 100; // Max batch size for models/embedding-001

/**
 * Generates embeddings for a list of texts using Google Gemini.
 * Handles batching to comply with API limits using `batchEmbedContents`.
 * @param texts An array of strings to embed.
 * @returns A Promise that resolves to a 2D array of embeddings (number[][]).
 * @throws Error if API key is missing or embedding generation fails.
 */
export async function getGeminiEmbeddings(texts: string[]): Promise<number[][]> {
    const allEmbeddings: number[][] = [];

    if (texts.length === 0) {
        console.log("[Embeddings] No texts provided for embedding. Returning empty array.");
        return [];
    }

    console.log(`[Embeddings] Starting embedding generation for ${texts.length} texts...`);

    for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
        const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);

        // CORRECTED: Add the required 'role' property to the content object
        const requests = batch.map(text => ({
            content: {
                role: 'user', // Added 'role' as required by 'Content' type
                parts: [{ text: text }]
            }
        }));

        try {
            // Use batchEmbedContents for processing multiple pieces of content
            const { embeddings: batchEmbeddingsResult } = await embeddingModel.batchEmbedContents({
                requests: requests
            });

            if (batchEmbeddingsResult && batchEmbeddingsResult.length > 0) {
                // batchEmbeddingsResult is an array of EmbedContentResponse, each with an 'embedding' property
                allEmbeddings.push(...batchEmbeddingsResult.map(item => item.values));
            } else {
                console.warn(`[Embeddings] No embeddings returned or empty array for batch starting at index ${i}.`);
            }
            console.log(`[Embeddings] Processed batch ${Math.floor(i / EMBEDDING_BATCH_SIZE) + 1}/${Math.ceil(texts.length / EMBEDDING_BATCH_SIZE)} (${batch.length} texts).`);
        } catch (error) {
            console.error(`[Embeddings] Error getting embeddings for batch starting at index ${i}:`, error);
            throw error; // Re-throw to propagate the error
        }
    }
    console.log(`[Embeddings] Finished embedding generation. Total embeddings: ${allEmbeddings.length}`);
    return allEmbeddings;
}