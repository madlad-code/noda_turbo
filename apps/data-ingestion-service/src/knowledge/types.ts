// apps/data-ingestion-service/src/knowledge/types.ts

/**
 * Represents a single document chunk that will be embedded and stored.
 * This mirrors LangChain's Document structure conceptually.
 */
export interface DocumentChunk {
    pageContent: string; // The actual text content to be embedded
    metadata: {
        sourceFilename: string; // e.g., 'buildings_table', 'daily_metrics_table' or original CSV filename
        originalRowId: string | number; // Unique identifier of the original row (e.g., UUID, primary key)
        sourceTable: string; // The logical table name (e.g., 'buildings', 'daily_metrics')

        // --- Specific metadata fields for your tables ---
        buildingUuid?: string;
        buildingName?: string;
        assetType?: string;
        timePeriod?: string; // Formatted as 'YYYY-MM-DD' for DB DATE type or full ISO string for TIMESTAMP
        timeRange?: string;  // e.g., 'Last 30 Days', 'Current Month'
        energyType?: string; // e.g., 'Electricity', 'Water', 'Gas'
        buildingControl?: string; // From dashboard_data, might be building name or ID
        propertyMeter?: string;   // From dashboard_data

        // Allow for any other arbitrary metadata properties
        [key: string]: any;
    };
}

/**
 * Generic interface for a row pulled from a CSV or database.
 * Properties will be accessed dynamically based on column names.
 */
export interface DbRow {
    [key: string]: string | number | boolean | null | undefined;
}

// You can add more specific types for each table's row if desired,
// but DbRow is sufficient for dynamic access.
/*
export interface BuildingRow extends DbRow {
    uuid: string;
    name: string;
    asset_type: string;
    // ... etc.
}
*/