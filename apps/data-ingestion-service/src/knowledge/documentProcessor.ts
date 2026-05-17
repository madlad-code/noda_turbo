// apps/data-ingestion-service/src/knowledge/documentProcessor.ts

import { DocumentChunk, DbRow } from './types'; // Import our defined types

// --- Helper Functions ---

/**
 * Parses a date value and formats it as a 'YYYY-MM-DD' string.
 * Handles various input types (string, Date object) and returns undefined for invalid dates.
 * @param dateValue The date value from the database row.
 * @returns Formatted date string (YYYY-MM-DD) or undefined.
 */
function parseAndFormatDate(dateValue: any): string | undefined {
    if (!dateValue) return undefined;
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            return undefined;
        }
        return date.toISOString().split('T')[0]; // '['YYYY-MM-DD]'
    } catch (e) {
        console.warn(`[DocProcessor] Could not parse date "${dateValue}":`, e);
        return undefined;
    }
}

/**
 * Formats a number to a fixed number of decimals, or returns 'N/A' if invalid/non-numeric.
 * This function should ONLY be used for numeric or numeric-string fields.
 * @param num The number value.
 * @param decimals The number of decimal places.
 * @returns Formatted number string or 'N/A'.
 */
function formatNumber(num: number | string | boolean | undefined | null, decimals: number = 2): string { // CORRECTED: Added 'boolean' to the type
    // Convert boolean to its numeric equivalent (0 or 1)
    if (typeof num === 'boolean') {
        num = num ? 1 : 0;
    }

    // Attempt to parse any string or number value
    const parsed = typeof num === 'string' ? parseFloat(num) : num;

    if (typeof parsed === 'number' && !isNaN(parsed)) {
        return parsed.toFixed(decimals);
    }
    return 'N/A'; // For undefined, null, or non-parseable strings
}

/**
 * Checks if a value is a valid number (i.e., can be successfully parsed into a finite number).
 * This includes actual numbers, and strings that represent numbers.
 * @param value The value to check.
 * @returns True if the value is a number or a numeric string (and not NaN), false otherwise.
 */
function isValidNumber(value: any): boolean { // CORRECTED
    // Handle booleans directly as they should be considered valid for numeric formatting
    if (typeof value === 'boolean') {
        return true;
    }
    // If it's null or undefined, it's not a valid number for our purpose
    if (value === null || typeof value === 'undefined') {
        return false;
    }
    // Attempt to parse it as a float. If it's a number, parseFloat returns the number.
    // If it's a numeric string, parseFloat parses it.
    const parsed = parseFloat(String(value)); // Ensure value is a string for parseFloat
    // Check if it's a finite number (not NaN, Infinity, or -Infinity)
    return typeof parsed === 'number' && !isNaN(parsed) && isFinite(parsed);
}

/**
 * Transforms a single database row into a DocumentChunk for RAG.
 * This is the "Librarian Writes Index Cards" step, converting structured data to natural language text.
 * @param row The raw database row object (DbRow).
 * @param tableName The logical name of the table the row came from (e.g., 'buildings').
 * @param sourceIdentifier An identifier for the source (e.g., table name, or specific query name).
 * @returns A DocumentChunk object or null if the row cannot be processed meaningfully.
 */
export async function processDbRowToDocument(row: DbRow, tableName: string, sourceIdentifier: string): Promise<DocumentChunk | null> {
    let pageContent = "";
    const metadata: DocumentChunk['metadata'] = {
        sourceFilename: sourceIdentifier,
        originalRowId: row.uuid?.toString() || row.id?.toString() || `row_${Math.random().toString(36).substring(7)}`,
        sourceTable: tableName,
        buildingUuid: undefined, buildingName: undefined, assetType: undefined,
        timePeriod: undefined, timeRange: undefined, energyType: undefined,
        buildingControl: undefined, propertyMeter: undefined,
    };

    if (tableName === 'buildings') {
        metadata.buildingUuid = row.uuid as string | undefined;
        metadata.buildingName = row.name as string | undefined;
        metadata.assetType = row.asset_type as string | undefined;

        const isActive = row.asset_active === true || row.asset_active === 'true';

        pageContent = (
            `Building '${metadata.buildingName || 'N/A'}' (UUID: ${metadata.buildingUuid || 'N/A'}), type: ${metadata.assetType || 'N/A'}. ` +
            `Status: ${row.asset_status || 'N/A'}. Location: Latitude ${formatNumber(row.asset_latitude as number | string | null | undefined, 4)}, Longitude ${formatNumber(row.asset_longitude as number | string | null | undefined, 4)}. ` +
            `Active: ${isActive ? 'Yes' : 'No'}.`
        );

    } else if (tableName === 'daily_metrics') {
        const timePeriod = parseAndFormatDate(row.time_period);
        if (timePeriod === undefined) {
            console.warn(`[DocProcessor] Skipping daily_metrics row due to invalid time_period: ${JSON.stringify(row)}`);
            return null;
        }
        metadata.buildingUuid = row.building_uuid as string | undefined;
        metadata.timePeriod = timePeriod;
        metadata.metricType = "daily_metrics";

        let metricsDetails: string[] = [];

        // --- ONLY INCLUDE CONTROL ACTIVITY ---
        if (isValidNumber(row.ctrl_activity)) {
            metricsDetails.push(`Control Activity: ${formatNumber(row.ctrl_activity)}`);
        }

        // If control activity is not available, state that explicitly.
        const metricsSummary = metricsDetails.length > 0 ? metricsDetails.join(', ') + '.' : 'No specific control activity available.';

        pageContent = (
            `Daily performance for building (UUID: ${metadata.buildingUuid || 'N/A'}) on ${timePeriod}: ` +
            `${metricsSummary}`
        );

    } else if (tableName === 'monthly_metrics') {
        const timePeriod = parseAndFormatDate(row.time_period);
        if (timePeriod === undefined) {
            console.warn(`[DocProcessor] Skipping monthly_metrics row due to invalid time_period: ${JSON.stringify(row)}`);
            return null;
        }
        metadata.buildingUuid = row.building_uuid as string | undefined;
        metadata.timePeriod = timePeriod;
        metadata.metricType = "monthly_metrics";

        let metricsDetails: string[] = [];

        // Conditionally add monthly metrics - CORRECTED COLUMN NAMES (retained from previous fix)
        if (isValidNumber(row.building_impact)) {
            metricsDetails.push(`Building Impact: ${formatNumber(row.building_impact)}`);
        }
        if (isValidNumber(row.saving_energy_perc)) {
            metricsDetails.push(`Energy Savings (Perc): ${formatNumber(row.saving_energy_perc)}%`);
        }
        if (isValidNumber(row.saving_kwh)) {
            metricsDetails.push(`Energy Savings (kWh): ${formatNumber(row.saving_kwh)}`);
        }
        if (isValidNumber(row.saving_energy_sek)) {
            metricsDetails.push(`Energy Savings (SEK): ${formatNumber(row.saving_energy_sek)}`);
        }
        if (isValidNumber(row.saving_demand_sek)) {
            metricsDetails.push(`Demand Savings (SEK): ${formatNumber(row.saving_demand_sek)}`);
        }
        if (isValidNumber(row.saving_rt_sek)) {
            metricsDetails.push(`RT SEK Savings: ${formatNumber(row.saving_rt_sek)}`);
        }
        if (isValidNumber(row.saving_volume_sek)) {
            metricsDetails.push(`Volume Savings (SEK): ${formatNumber(row.saving_volume_sek)}`);
        }
        if (isValidNumber(row.saving_total_sek)) {
            metricsDetails.push(`Total SEK Savings: ${formatNumber(row.saving_total_sek)}`);
        }
        if (isValidNumber(row.c02_avg)) {
            metricsDetails.push(`Average CO2: ${formatNumber(row.c02_avg)}`);
        }
        if (isValidNumber(row.c02_saved)) {
            metricsDetails.push(`CO2 Saved: ${formatNumber(row.c02_saved)}`);
        }
        if (isValidNumber(row.idt_avg)) {
            metricsDetails.push(`IDT Avg: ${formatNumber(row.idt_avg)}`);
        }
        if (isValidNumber(row.idt_wanted)) {
            metricsDetails.push(`IDT Wanted: ${formatNumber(row.idt_wanted)}`);
        }

        const metricsSummary = metricsDetails.length > 0 ? metricsDetails.join(', ') + '.' : 'No specific monthly metrics available.';

        pageContent = (
            `Monthly summary for building (UUID: ${metadata.buildingUuid || 'N/A'}) in ${timePeriod}: ` +
            `${metricsSummary}`
        );

    } else if (tableName === 'dashboard_data') {
        const timePeriod = parseAndFormatDate(row.time_period);
        if (timePeriod === undefined) {
            console.warn(`[DocProcessor] Skipping dashboard_data row due to invalid time_period: ${JSON.stringify(row)}`);
            return null;
        }
        metadata.buildingControl = row.building_control as string | undefined;
        metadata.propertyMeter = row.property_meter as string | undefined;
        metadata.energyType = row.energy_type as string | undefined; // Keep as is, will be N/A if null/undefined in DB
        metadata.timeRange = row.time_range as string | undefined;   // Keep as is, will be N/A if null/undefined in DB
        metadata.timePeriod = timePeriod;
        metadata.metricType = "dashboard_data";

        let metricsDetails: string[] = [];

        // Conditionally add dashboard metrics
        if (isValidNumber(row.kwh)) {
            metricsDetails.push(`Total kWh: ${formatNumber(row.kwh)}`);
        }
        if (isValidNumber(row.volume_spec)) {
            metricsDetails.push(`Volume Spec: ${formatNumber(row.volume_spec)}`);
        }
        if (isValidNumber(row.demand_k)) {
            metricsDetails.push(`Demand (kW): ${formatNumber(row.demand_k)}`);
        }
        if (isValidNumber(row.demand_max)) {
            metricsDetails.push(`Max Demand: ${formatNumber(row.demand_max)}`);
        }
        if (isValidNumber(row.supply_abs)) {
            metricsDetails.push(`Absolute Supply: ${formatNumber(row.supply_abs)}`);
        }
        if (isValidNumber(row.fault_count)) {
            metricsDetails.push(`Recorded Fault Count: ${formatNumber(row.fault_count, 0)}`);
        }
        if (isValidNumber(row.data_quality_missing_energy)) {
            metricsDetails.push(`Missing energy data points: ${formatNumber(row.data_quality_missing_energy, 0)}`);
        }
        if (isValidNumber(row.data_quality_outlier_flow)) {
            metricsDetails.push(`Outlier flow readings: ${formatNumber(row.data_quality_outlier_flow, 0)}`);
        }
        // Add other specific dashboard metrics from your schema if they are consistently populated:
        if (isValidNumber(row.overflow_abs)) { metricsDetails.push(`Overflow Abs: ${formatNumber(row.overflow_abs)}`); }
        if (isValidNumber(row.energy_abs)) { metricsDetails.push(`Energy Abs: ${formatNumber(row.energy_abs)}`); }
        if (isValidNumber(row.volume_abs)) { metricsDetails.push(`Volume Abs: ${formatNumber(row.volume_abs)}`); }
        if (isValidNumber(row.flow_dim)) { metricsDetails.push(`Flow Dim: ${formatNumber(row.flow_dim)}`); }
        if (isValidNumber(row.efficiency)) { metricsDetails.push(`Efficiency: ${formatNumber(row.efficiency)}`); }
        if (isValidNumber(row.supply_flex)) { metricsDetails.push(`Supply Flex: ${formatNumber(row.supply_flex)}`); }
        if (isValidNumber(row.fault_prim_loss)) { metricsDetails.push(`Fault Prim Loss: ${formatNumber(row.fault_prim_loss, 0)}`); }
        if (isValidNumber(row.fault_smirch)) { metricsDetails.push(`Fault Smirch: ${formatNumber(row.fault_smirch, 0)}`); }
        if (isValidNumber(row.fault_heat_sys)) { metricsDetails.push(`Fault Heat Sys: ${formatNumber(row.fault_heat_sys, 0)}`); }
        // You can continue adding checks for all the numeric fields from your dashboard_data table
        // like 'dt_abs', 'rt_abs', 'ntu', 'lmtd', etc.

        const metricsSummary = metricsDetails.length > 0 ? metricsDetails.join(', ') + '.' : 'No specific dashboard metrics available.';

        pageContent = (
            `Dashboard report for building '${metadata.buildingControl || 'N/A'}' (Property Meter: ${metadata.propertyMeter || 'N/A'}) ` +
            `related to ${metadata.energyType || 'N/A'} for ${metadata.timeRange || 'N/A'} ending ${timePeriod}: ` +
            `${metricsSummary}`
        );

    } else {
        console.warn(`[DocProcessor] Warning: No specific processing logic for table type '${tableName}'. Skipping row.`);
        return null;
    }

    if (pageContent) {
        return { pageContent, metadata };
    }
    return null; // Fallback, though ideally contentText is always built for recognized types
}