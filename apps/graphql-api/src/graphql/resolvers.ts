// apps/graphql-api/src/graphql/resolvers.ts

import { GraphQLError } from 'graphql';
import { MyContext } from './context';

// --- TypeScript interfaces for type safety ---
// (Your existing interfaces remain here)
interface BuildingDBRow {
  uuid: string;
  name: string;
  asset_type: string;
  asset_status: string;
  asset_active: boolean;
  asset_latitude: number;
  asset_longitude: number;
  created_at: string;
  updated_at: string;
}

interface WeatherDataDBRow {
  id: number;
  asset_name: string;
  time_period: string;
  cloudiness: number;
  outdoor_temperature: number;
}


// --- The Final, Corrected Query Builder ---
const buildPageQuery = (
  targetTable: string,
  uuidColumnName: string,  
  systemFilter?: { uuids?: string[]; nameContains?: string; assetType?: string; assetStatus?: string; assetActive?: boolean },
  dateFilter?: { startDate?: string; endDate?: string }
) => {
    // ... your existing buildPageQuery function remains exactly the same
    const params: any[] = [];
    let paramIndex = 1;
    const whereClauses: string[] = [];

    const needsJoin = systemFilter?.nameContains || systemFilter?.assetType || systemFilter?.assetStatus || systemFilter?.assetActive !== undefined;
    
    let query = `SELECT T.* FROM ${targetTable} T`;

    if (needsJoin) {
      query += ` JOIN buildings B ON T.${uuidColumnName} = B.uuid`;
    }
    
    if (dateFilter) {
      whereClauses.push(`T.time_period BETWEEN $${paramIndex++} AND $${paramIndex++}`);
      params.push(dateFilter.startDate, dateFilter.endDate);
    }

    if (systemFilter) {
      if (systemFilter.uuids?.length) {
        whereClauses.push(`T.${uuidColumnName} = ANY($${paramIndex++})`);
        params.push(systemFilter.uuids);
      }
      if (systemFilter.nameContains) {
        whereClauses.push(`B.name ILIKE $${paramIndex++}`);
        params.push(`%${systemFilter.nameContains}%`);
      }
      if (systemFilter.assetType) {
        whereClauses.push(`B.asset_type = $${paramIndex++}`);
        params.push(systemFilter.assetType);
      }
      if (systemFilter.assetStatus) {
        whereClauses.push(`B.asset_status = $${paramIndex++}`);
        params.push(systemFilter.assetStatus);
      }
      if (systemFilter.assetActive !== undefined) {
        whereClauses.push(`B.asset_active = $${paramIndex++}`);
        params.push(systemFilter.assetActive);
      }
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    
    query += ` ORDER BY T.${uuidColumnName}, T.time_period ASC;`;

    return { query, params };
};

export const resolvers = {
  Query: {
    // --- All your existing Query resolvers are untouched ---
    overview: async (_: any, __: any, context: MyContext) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      const [buildingsResult, weatherResult] = await Promise.all([
        context.db.query('SELECT * FROM buildings ORDER BY name ASC'),
        context.db.query('SELECT *, time_period as "time_period" FROM weather_data ORDER BY time_period DESC LIMIT 100')
      ]);
      return { buildings: buildingsResult.rows, weather: weatherResult.rows };
    },

    retrospectData: async (_: any, { systemFilter, dateFilter }: any, context: MyContext) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      const { query, params } = buildPageQuery('dashboard_data', 'uuid', systemFilter, dateFilter);
      const result = await context.db.query(query, params);
      return result.rows;
    },

    dailyMetrics: async (_: any, { systemFilter, dateFilter }: any, context: MyContext) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      const { query, params } = buildPageQuery('daily_metrics', 'building_uuid', systemFilter, dateFilter);
      const result = await context.db.query(query, params);
      return result.rows;
    },

    monthlyMetrics: async (_: any, { systemFilter, dateFilter }: any, context: MyContext) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      const { query, params } = buildPageQuery('monthly_metrics', 'building_uuid', systemFilter, dateFilter);
      const result = await context.db.query(query, params);
      return result.rows;
    },
  },
  
  // ADDED: This entire Mutation block is new. It contains the logic for the 'analyse' function.
  Mutation: {
    analyse: async (_: any, { question, history }: { question: string; history?: any[] }, context: MyContext) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      try {
        console.log(`Proxying question to LLM service: "${question}"`);
        if (history) {
          console.log(`With history containing ${history.length} messages.`);
        }

        const llmServiceUrl = process.env.LLM_SERVICE_URL;
        if (!llmServiceUrl) {
          throw new Error("LLM_SERVICE_URL environment variable is not set.");
        }

        // Fetch a streaming response from the Python LLM service
        const response = await fetch(`${llmServiceUrl}/api/v1/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question,
            history, // Pass the history along
          }),
        });

        if (!response.body) {
          throw new Error("The response from the LLM service has no body.");
        }
        
        // This returns the raw stream to be handled by your server framework (e.g., GraphQL Yoga)
        return response.body;

      } catch (error) {
        console.error("Error proxying request to the LLM service:", error);
        throw new GraphQLError("There was a problem communicating with the LLM service.");
      }
    },
  },

  // --- All your existing Type resolvers are untouched ---
  WeatherData: {
      outdoor_temperature: (parent: WeatherDataDBRow) => parent.outdoor_temperature,
  },
  Building: {
    asset_type: (parent: BuildingDBRow) => parent.asset_type,
    asset_status: (parent: BuildingDBRow) => parent.asset_status,
    asset_active: (parent: BuildingDBRow) => parent.asset_active,
    asset_latitude: (parent: BuildingDBRow) => parent.asset_latitude,
    asset_longitude: (parent: BuildingDBRow) => parent.asset_longitude,
    created_at: (parent: BuildingDBRow) => parent.created_at,
    updated_at: (parent: BuildingDBRow) => parent.updated_at,
  }
};