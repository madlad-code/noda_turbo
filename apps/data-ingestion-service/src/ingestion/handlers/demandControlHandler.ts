// FILE: apps/data-ingestion-service/src/ingestion/handlers/demandControlHandler.ts
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { DatabaseService, CsvRow } from '../../db';
import { normalizeCsvHeaders } from '../util/normalize-headers';

export class DemandControlHandler {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  public async process(filePath: string): Promise<void> {
    console.log(`[DemandControlHandler] Processing ${path.basename(filePath)}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const results = await new Promise<Papa.ParseResult<CsvRow>>((resolve, reject) => {
        Papa.parse(fileContent, { header: true, dynamicTyping: true, skipEmptyLines: true, complete: resolve, error: reject });
    });

    const data = normalizeCsvHeaders(results.data);

    for (const row of data) {
      const buildingName = row['building_control'];
      const timePeriodStr = row['time_period'];

      if (!buildingName || !timePeriodStr) {
        console.warn(`[DemandControlHandler] Skipping row due to missing data: ${JSON.stringify(row)}`);
        continue;
      }

      const [month, day, year] = (timePeriodStr as string).split('/');
      const parsedDate = new Date(`${year}-${month}-${day}`);
      if (isNaN(parsedDate.getTime())) {
          console.warn(`[DemandControlHandler] Could not parse date: "${timePeriodStr}". Skipping row.`);
          continue;
      }

      const systemId = await this.dbService.getUuidForBuilding(buildingName as string);
      if (!systemId) {
        console.warn(`[DemandControlHandler] No UUID found for building "${buildingName}". Skipping daily metrics for this row.`);
        continue;
      }
      
      await this.dbService.insertDailyMetrics({
        building_uuid: systemId,
        time_period: parsedDate,
        demand: row['demand'] as number,
        flow: row['flow'] as number,
        temperature_supply: row['temperature_supply'] as number,
        temperature_return: row['temperature_return'] as number,
        ctrl_activity: row['ctrl_activity'] as number,
      });
    }
    console.log(`[DemandControlHandler] Successfully processed ${data.length} rows.`);
  }
}