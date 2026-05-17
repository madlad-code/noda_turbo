// FILE: apps/data-ingestion-service/src/ingestion/handlers/retrospectHandler.ts
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { DatabaseService, CsvRow } from '../../db';
import { normalizeCsvHeaders } from '../util/normalize-headers';

export class RetrospectHandler {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  public async process(filePath: string): Promise<void> {
    console.log(`[RetrospectHandler] Processing ${path.basename(filePath)}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    const results = await new Promise<Papa.ParseResult<CsvRow>>((resolve, reject) => {
        Papa.parse(fileContent, { header: true, dynamicTyping: true, skipEmptyLines: true, complete: resolve, error: reject });
    });

    const data = normalizeCsvHeaders(results.data);

    for (const row of data) {
      const buildingName = row['building_control'];
      const systemId = row['uuid'];
      const timePeriodStr = row['time_period'];

      if (!buildingName || !systemId || !timePeriodStr) {
        console.warn(`[RetrospectHandler] Skipping row due to missing critical data (building_control, uuid, or time_period): ${JSON.stringify(row)}`);
        continue;
      }

      const [month, day, year] = (timePeriodStr as string).split('/');
      const parsedDate = new Date(`${year}-${month}-${day}`);
      if (isNaN(parsedDate.getTime())) {
          console.warn(`[RetrospectHandler] Could not parse date: "${timePeriodStr}". Skipping row.`);
          continue;
      }

      await this.dbService.upsertBuilding({
        uuid: systemId as string,
        name: buildingName as string,
        asset_latitude: row['asset_latitude'] as number,
        asset_longitude: row['asset_longitude'] as number,
      });

      await this.dbService.insertDailyMetrics({
        building_uuid: systemId as string,
        time_period: parsedDate,
        efficiency: row['efficiency'] as number,
        rank_overall: row['rank_overall'] as number,
      });

      await this.dbService.upsertDashboardData(row);
    }
    console.log(`[RetrospectHandler] Successfully processed ${data.length} rows.`);
  }
}