// =================================================================
// FILE: apps/graphql-api/src/realtime/postgres-listener.ts
// The final, definitive, and correct version.
// =================================================================
import pool from '../graphql/db';
import { pubsub } from './pubsub';

const CHANNEL_NAME = 'dashboard_updates';

export const startPostgresListener = async () => {
  const client = await pool.connect();
  
  client.on('notification', (msg) => {
    try {
      console.log(`Received notification from PostgreSQL on channel '${msg.channel}'`);
      if (msg.payload) {
        const rawPayload = JSON.parse(msg.payload);
        
        // --- THIS IS THE CRUCIAL FIX ---
        // We create a payload object where the top-level key 'systemUpdated'
        // EXACTLY matches the subscription field name in our schema.
        const correctlyShapedPayload = {
          systemUpdated: rawPayload 
        };
        
        // We now publish this correctly shaped object to a single, consistent topic.
        pubsub.publish('SYSTEM_UPDATED', correctlyShapedPayload)
          .catch(err => {
            console.error('Redis publish error:', err);
          });
          
        console.log('Published correctly shaped update to Redis.');
      }
    } catch (error) {
      console.error('Error handling notification payload:', error);
    }
  });

  await client.query(`LISTEN ${CHANNEL_NAME}`);
  console.log(`PostgreSQL listener started on channel: ${CHANNEL_NAME}`);
  
  client.on('error', (err) => {
    console.error('PostgreSQL listener client error:', err);
  });
};