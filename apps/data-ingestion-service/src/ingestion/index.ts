// FILE: apps/data-ingestion-service/src/ingestion/index.ts
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs/promises';
import { DatabaseService } from '../db';
import { BuildingImpactHandler } from './handlers/buildingImpactHandler';
import { DemandControlHandler } from './handlers/demandControlHandler';
import { OverviewHandler } from './handlers/overviewHandler';
import { RetrospectHandler } from './handlers/retrospectHandler';

export class IngestionService {
  private incomingDir: string;
  private processedDir: string;
  private errorDir: string;

  private buildingImpactHandler: BuildingImpactHandler;
  private demandControlHandler: DemandControlHandler;
  private overviewHandler: OverviewHandler;
  private retrospectHandler: RetrospectHandler;

  private batchTracker = new Map<string, Map<string, string>>();
  private readonly REQUIRED_FILE_TYPES = ['Building_Impact', 'Demand_Control', 'Overview', 'Retrospect'];

  constructor(dbService: DatabaseService) {
    this.buildingImpactHandler = new BuildingImpactHandler(dbService);
    this.demandControlHandler = new DemandControlHandler(dbService);
    this.overviewHandler = new OverviewHandler(dbService);
    this.retrospectHandler = new RetrospectHandler(dbService);

    this.incomingDir = process.env.CSV_INCOMING_DIR ?? path.resolve(__dirname, '../../data/incoming');
    this.processedDir = process.env.CSV_PROCESSED_DIR ?? path.resolve(__dirname, '../../data/processed');
    this.errorDir = process.env.CSV_ERROR_DIR ?? path.resolve(__dirname, '../../data/errors');
  }

  public start(): void {
    this.ensureDirs().then(() => {
      console.log(`[IngestionService] Watching for new files in: ${this.incomingDir}`);
      const watcher = chokidar.watch(this.incomingDir, {
        persistent: true,
        ignored: /^\./,
        awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 },
      });
      watcher.on('add', (filePath) => this.handleNewFile(filePath));
    });
  }

  private async handleNewFile(filePath: string): Promise<void> {
    const fileName = path.basename(filePath);
    
    const fileType = this.REQUIRED_FILE_TYPES.find(type => fileName.includes(type));
    const match = fileName.match(/(\d{4}-\d{2}-\d{2})/);
    const batchKey = match?.[1] ?? 'default-batch';

    if (!fileType) {
        console.warn(`[IngestionService] File ${fileName} does not match any required type. Skipping.`);
        return;
    }
    
    console.log(`[IngestionService] File detected: ${fileName} for batch ${batchKey}`);

    if (!this.batchTracker.has(batchKey)) {
        this.batchTracker.set(batchKey, new Map<string, string>());
    }
    const currentBatch = this.batchTracker.get(batchKey)!;
    
    currentBatch.set(fileType, filePath);

    const isBatchComplete = this.REQUIRED_FILE_TYPES.every(type => currentBatch.has(type));

    if (isBatchComplete) {
        console.log(`[IngestionService] Complete batch ${batchKey} detected. Starting processing.`);
        await this.processBatch(currentBatch);
        this.batchTracker.delete(batchKey);
    } else {
        console.log(`[IngestionService] Batch ${batchKey} is still incomplete. Waiting for more files.`);
    }
  }

  private async processBatch(batch: Map<string, string>): Promise<void> {
    try {
        await this.retrospectHandler.process(batch.get('Retrospect')!);
        await this.demandControlHandler.process(batch.get('Demand_Control')!);
        await this.overviewHandler.process(batch.get('Overview')!);
        await this.buildingImpactHandler.process(batch.get('Building_Impact')!);
        
        console.log('[IngestionService] All files in batch processed successfully.');

        for (const filePath of batch.values()) {
            const fileName = path.basename(filePath);
            const destPath = path.join(this.processedDir, fileName);
            await fs.rename(filePath, destPath);
            console.log(`[IngestionService] Moved processed file to: ${destPath}`);
        }
    } catch (error) {
        console.error(`[IngestionService] Error processing batch:`, error);
        for (const filePath of batch.values()) {
            const fileName = path.basename(filePath);
            const destPath = path.join(this.errorDir, fileName);
            await fs.rename(filePath, destPath);
        }
    }
  }

  private async ensureDirs(): Promise<void> {
    await fs.mkdir(this.incomingDir, { recursive: true });
    await fs.mkdir(this.processedDir, { recursive: true });
    await fs.mkdir(this.errorDir, { recursive: true });
  }
}