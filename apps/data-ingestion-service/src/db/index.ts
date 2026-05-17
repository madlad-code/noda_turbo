// FILE: apps/data-ingestion-service/src/db/index.ts

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export interface CsvRow {
    [key: string]: string | number | null | undefined;
}

export class DatabaseService {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }

    public async initialize(): Promise<void> {
        await this.connectDb();
        await this.runMigrations();
    }

    public async connectDb(): Promise<void> {
        try {
            const client = await this.pool.connect();
            console.log('Successfully connected to PostgreSQL database.');
            client.release();
        } catch (error: any) {
            console.error('Failed to connect to PostgreSQL:', error);
            throw error;
        }
    }

    public async runMigrations(): Promise<void> {
        console.log('Checking database schema...');
        const client = await this.pool.connect();
        try {
            const migrationDir = path.resolve(__dirname, '../migrations');
            const files = await fs.readdir(migrationDir);
            const migrationFiles = files.filter(file => file.endsWith('.sql')).sort();
            
            for (const file of migrationFiles) {
                console.log(`Applying migration: ${file}`);
                const filePath = path.join(migrationDir, file);
                const sql = await fs.readFile(filePath, 'utf-8');
                await client.query(sql);
            }
            console.log('Database schema is up to date.');
        } catch (error) {
            console.error('Failed to run database migrations:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    public async upsertBuilding(building: {
        uuid: string;
        name: string;
        asset_type?: string;
        asset_status?: string;
        asset_active?: boolean;
        asset_latitude?: number;
        asset_longitude?: number;
    }) {
        const { uuid, name, asset_type, asset_status, asset_active, asset_latitude, asset_longitude } = building;
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO buildings (uuid, name, asset_type, asset_status, asset_active, asset_latitude, asset_longitude, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                ON CONFLICT (uuid) DO UPDATE SET
                  name = EXCLUDED.name,
                  asset_type = COALESCE(EXCLUDED.asset_type, buildings.asset_type),
                  asset_status = COALESCE(EXCLUDED.asset_status, buildings.asset_status),
                  asset_active = COALESCE(EXCLUDED.asset_active, buildings.asset_active),
                  asset_latitude = COALESCE(EXCLUDED.asset_latitude, buildings.asset_latitude),
                  asset_longitude = COALESCE(EXCLUDED.asset_longitude, buildings.asset_longitude),
                  updated_at = CURRENT_TIMESTAMP;
            `;
            await client.query(query, [uuid, name, asset_type, asset_status, asset_active, asset_latitude, asset_longitude]);
        } finally {
            client.release();
        }
    }

    public async getUuidForBuilding(name: string): Promise<string | null> {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT uuid FROM buildings WHERE name = $1', [name]);
            return result.rows[0]?.uuid || null;
        } finally {
            client.release();
        }
    }

    public async insertDailyMetrics(metrics: {
        building_uuid: string;
        time_period: Date;
        efficiency?: number;
        rank_overall?: number;
        demand?: number;
        flow?: number;
        temperature_supply?: number;
        temperature_return?: number;
        ctrl_activity?: number;
    }) {
        const {
            building_uuid, time_period, efficiency, rank_overall,
            demand, flow, temperature_supply, temperature_return,
            ctrl_activity
        } = metrics;
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO daily_metrics (building_uuid, time_period, efficiency, rank_overall, demand, flow, temperature_supply, temperature_return, ctrl_activity)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (building_uuid, time_period) DO UPDATE SET
                  efficiency = COALESCE(EXCLUDED.efficiency, daily_metrics.efficiency),
                  rank_overall = COALESCE(EXCLUDED.rank_overall, daily_metrics.rank_overall),
                  demand = COALESCE(EXCLUDED.demand, daily_metrics.demand),
                  flow = COALESCE(EXCLUDED.flow, daily_metrics.flow),
                  temperature_supply = COALESCE(EXCLUDED.temperature_supply, daily_metrics.temperature_supply),
                  temperature_return = COALESCE(EXCLUDED.temperature_return, daily_metrics.temperature_return),
                  ctrl_activity = COALESCE(EXCLUDED.ctrl_activity, daily_metrics.ctrl_activity);
            `;
            await client.query(query, [building_uuid, time_period, efficiency, rank_overall, demand, flow, temperature_supply, temperature_return, ctrl_activity]);
        } finally {
            client.release();
        }
    }

    public async insertMonthlyMetrics(metrics: {
        building_uuid: string;
        time_period: Date;
        building_impact?: number;
        saving_kwh?: number;
        saving_energy_perc?: number;
        saving_energy_sek?: number;
        saving_demand_sek?: number;
        saving_rt_sek?: number;
        saving_volume_sek?: number;
        saving_total_sek?: number;
        idt_avg?: number;
        idt_wanted?: number;
    }) {
        const {
            building_uuid, time_period, building_impact, saving_kwh, saving_energy_perc, saving_energy_sek, saving_demand_sek,
            saving_rt_sek, saving_volume_sek, saving_total_sek, idt_avg, idt_wanted
        } = metrics;
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO monthly_metrics (building_uuid, time_period, building_impact, saving_kwh, saving_energy_perc, saving_energy_sek, saving_demand_sek, saving_rt_sek, saving_volume_sek, saving_total_sek, idt_avg, idt_wanted)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (building_uuid, time_period) DO UPDATE SET
                  building_impact = COALESCE(EXCLUDED.building_impact, monthly_metrics.building_impact),
                  saving_kwh = COALESCE(EXCLUDED.saving_kwh, monthly_metrics.saving_kwh),
                  saving_energy_perc = COALESCE(EXCLUDED.saving_energy_perc, monthly_metrics.saving_energy_perc),
                  saving_energy_sek = COALESCE(EXCLUDED.saving_energy_sek, monthly_metrics.saving_energy_sek),
                  saving_demand_sek = COALESCE(EXCLUDED.saving_demand_sek, monthly_metrics.saving_demand_sek),
                  saving_rt_sek = COALESCE(EXCLUDED.saving_rt_sek, monthly_metrics.saving_rt_sek),
                  saving_volume_sek = COALESCE(EXCLUDED.saving_volume_sek, monthly_metrics.saving_volume_sek),
                  saving_total_sek = COALESCE(EXCLUDED.saving_total_sek, monthly_metrics.saving_total_sek),
                  idt_avg = COALESCE(EXCLUDED.idt_avg, monthly_metrics.idt_avg),
                  idt_wanted = COALESCE(EXCLUDED.idt_wanted, monthly_metrics.idt_wanted);
            `;
            await client.query(query, [building_uuid, time_period, building_impact, saving_kwh, saving_energy_perc, saving_energy_sek, saving_demand_sek, saving_rt_sek, saving_volume_sek, saving_total_sek, idt_avg, idt_wanted]);
        } finally {
            client.release();
        }
    }

    public async insertWeatherData(weather: {
        asset_name?: string;
        time_period: Date;
        cloudiness: number;
        outdoor_temperature: number;
    }) {
        const { asset_name, time_period, cloudiness, outdoor_temperature } = weather;
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO weather_data (asset_name, time_period, cloudiness, outdoor_temperature)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (asset_name, time_period) DO UPDATE SET
                  cloudiness = EXCLUDED.cloudiness,
                  outdoor_temperature = EXCLUDED.outdoor_temperature;
            `;
            await client.query(query, [asset_name, time_period, cloudiness, outdoor_temperature]);
        } finally {
            client.release();
        }
    }

    public async upsertDashboardData(data: CsvRow) {
        const client = await this.pool.connect();
        try {
            const columns = Object.keys(data).filter(key =>
                key && key.trim() !== '' &&
                key !== 'id' && key !== 'asset_latitude' && key !== 'asset_longitude'
            );

            const values = columns.map(col => {
                if (col === 'time_period') {
                    const [month, day, year] = (data[col] as string).split('/');
                    return new Date(`${year}-${month}-${day}`);
                }
                return data[col];
            });

            const updateSet = columns.filter(c => c !== 'uuid' && c !== 'time_period').map(col =>
                `${col} = COALESCE(EXCLUDED.${col}, dashboard_data.${col})`
            );

            const query = `
                INSERT INTO dashboard_data (${columns.join(', ')})
                VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
                ON CONFLICT (uuid, time_period) DO UPDATE SET
                  ${updateSet.join(', ')};
            `;
            await client.query(query, values);
        } finally {
            client.release();
        }
    }

    public async disconnect(): Promise<void> {
        await this.pool.end();
    }
}