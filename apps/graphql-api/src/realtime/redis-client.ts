// =================================================================
// FILE: apps/graphql-api/src/realtime/redis-client.ts
// (Updated with explicit type annotations to fix the build error)
// =================================================================
import { createClient, RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// --- FIX: Add explicit RedisClientType annotation ---
const publisher: RedisClientType = createClient({ url: redisUrl });
const subscriber: RedisClientType = publisher.duplicate();

// Add error handlers to see any connection issues
publisher.on('error', (err) => console.error('Redis Publisher Error', err));
subscriber.on('error', (err) => console.error('Redis Subscriber Error', err));

// A single function to connect both clients
export const connectRedis = async () => {
  try {
    await Promise.all([publisher.connect(), subscriber.connect()]);
    console.log('Redis clients connected successfully.');
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    process.exit(1);
  }
};

// Export the connected clients for use in our pubsub system
export { publisher, subscriber };