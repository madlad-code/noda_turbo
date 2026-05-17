// FILE: apps/data-ingestion-service/src/ingestion/handlers/buildingImpactHandler.ts
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { DatabaseService, CsvRow } from '../../db';
import { normalizeCsvHeaders } from '../util/normalize-headers';

export class BuildingImpactHandler {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  public async process(filePath: string): Promise<void> {
    console.log(`[BuildingImpactHandler] Processing ${path.basename(filePath)}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const results = await new Promise<Papa.ParseResult<CsvRow>>((resolve, reject) => {
        Papa.parse(fileContent, { header: true, dynamicTyping: true, skipEmptyLines: true, complete: resolve, error: reject });
    });

    const data = normalizeCsvHeaders(results.data);

    for (const row of data) {
      const buildingName = row['building_control'];
      const timePeriodStr = row['time_period'];

      if (!buildingName || !timePeriodStr) {
        console.warn(`[BuildingImpactHandler] Skipping row due to missing data: ${JSON.stringify(row)}`);
        continue;
      }

      const [month, day, year] = (timePeriodStr as string).split('/');
      const parsedDate = new Date(`${year}-${month}-${day}`);
      if (isNaN(parsedDate.getTime())) {
          console.warn(`[BuildingImpactHandler] Could not parse date: "${timePeriodStr}". Skipping row.`);
          continue;
      }
      
      const systemId = await this.dbService.getUuidForBuilding(buildingName as string);
      if (!systemId) {
        console.warn(`[BuildingImpactHandler] No UUID found for building "${buildingName}". Skipping row.`);
        continue;
      }

      let savingKwhValue: number | undefined;
      if (typeof row['saving_kwh'] === 'string') {
        savingKwhValue = parseFloat(row['saving_kwh'].replace(/,/g, ''));
      } else if (typeof row['saving_kwh'] === 'number') {
        savingKwhValue = row['saving_kwh'];
      }

      let savingEnergyPercValue: number | undefined;
      const rawPercValue = row['saving_energy'];

      if (rawPercValue !== undefined && rawPercValue !== null && String(rawPercValue).trim() !== '') {
          const cleanedValue = String(rawPercValue)
              .replace(/,/g, '.')
              .replace(/[^\d.-]/g, '');
          
          savingEnergyPercValue = parseFloat(cleanedValue);
          
          if (isNaN(savingEnergyPercValue)) {
              savingEnergyPercValue = undefined;
          }
      }
      
      await this.dbService.insertMonthlyMetrics({
        building_uuid: systemId,
        time_period: parsedDate,
        building_impact: row['saving_total_sek'] as number,
        saving_kwh: savingKwhValue,
        saving_energy_perc: savingEnergyPercValue,
        saving_energy_sek: row['saving_energy_sek'] as number,
        saving_demand_sek: row['saving_demand_sek'] as number,
        saving_rt_sek: row['saving_rt_sek'] as number,
        saving_volume_sek: row['saving_volume_sek'] as number,
        saving_total_sek: row['saving_total_sek'] as number,
        idt_avg: row['idt_avg'] as number,
        idt_wanted: row['idt_wanted'] as number,
      });
    }
    console.log(`[BuildingImpactHandler] Successfully processed ${data.length} rows.`);
  }
}