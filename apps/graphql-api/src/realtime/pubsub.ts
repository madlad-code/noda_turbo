// =================================================================
// FILE: apps/graphql-api/src/realtime/pubsub.ts
// (Updated with type casting to resolve the error)
// =================================================================
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { publisher, subscriber } from './redis-client';

// The RedisPubSub instance now uses the pre-connected clients.
// We cast them to 'any' to resolve a known type incompatibility
// between the latest redis client and the subscription library.
export const pubsub = new RedisPubSub({
  publisher: publisher as any,
  subscriber: subscriber as any,
});