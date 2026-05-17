// FILE: apps/data-ingestion-service/src/ingestion/handlers/overviewHandler.ts
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { DatabaseService, CsvRow } from '../../db';
import { normalizeCsvHeaders } from '../util/normalize-headers';

export class OverviewHandler {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  public async process(filePath: string): Promise<void> {
    console.log(`[OverviewHandler] Processing ${path.basename(filePath)}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const results = await new Promise<Papa.ParseResult<CsvRow>>((resolve, reject) => {
        Papa.parse(fileContent, { header: true, dynamicTyping: true, skipEmptyLines: true, complete: resolve, error: reject });
    });
    
    const data = normalizeCsvHeaders(results.data);

    for (const row of data) {
      const assetName = row['asset_name'];
      const timePeriodStr = row['timestamp_weather'];

      if (!timePeriodStr) {
        console.warn(`[OverviewHandler] Skipping row due to missing time_period: ${JSON.stringify(row)}`);
        continue;
      }

      const parsedDate = new Date(timePeriodStr as string);
      if (isNaN(parsedDate.getTime())) {
          console.warn(`[OverviewHandler] Could not parse date: "${timePeriodStr}". Skipping row.`);
          continue;
      }
      
      if (assetName) {
        const systemId = await this.dbService.getUuidForBuilding(assetName as string);

        if (systemId) {
          let assetActiveBoolean: boolean | undefined;
          if (typeof row['asset_active'] === 'number') {
              assetActiveBoolean = row['asset_active'] === 1;
          } else if (typeof row['asset_active'] === 'string') {
              assetActiveBoolean = parseInt(row['asset_active']) === 1;
          }

          await this.dbService.upsertBuilding({
            uuid: systemId,
            name: assetName as string,
            asset_type: row['asset_type'] as string,
            asset_status: row['asset_status'] as string,
            asset_active: assetActiveBoolean,
            asset_latitude: row['asset_latitude'] as number,
            asset_longitude: row['asset_longitude'] as number,
          });
        } else {
          console.warn(`[OverviewHandler] No UUID found for building "${assetName}". Static building details won't be updated from this file.`);
        }
      }

      await this.dbService.insertWeatherData({
        asset_name: assetName as string || undefined,
        time_period: parsedDate,
        cloudiness: row['cloudiness'] as number,
        outdoor_temperature: row['outdoor_temperature'] as number,
      });
    }
    console.log(`[OverviewHandler] Successfully processed ${data.length} rows.`);
  }
}