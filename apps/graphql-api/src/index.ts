// =================================================================
// FILE: apps/graphql-api/src/index.ts (Updated)
// =================================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';

// +++ ADD THIS IMPORT +++
import axios from 'axios';

import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { MyContext, createContext } from './graphql/context';
import authRoutes from './auth';
import exportRoutes from './export';
import { startPostgresListener } from './realtime/postgres-listener';
import { connectRedis } from './realtime/redis-client';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const schema = makeExecutableSchema({ typeDefs, resolvers });

const startServer = async () => {
  await connectRedis();

  // --- No changes to your existing WebSocket setup ---
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/api/graphql',
  });
  const serverCleanup = useServer({ schema }, wsServer);

  // --- No changes to your existing Apollo Server setup ---
  const server = new ApolloServer<MyContext>({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.use(cors());
  app.use(express.json());

  // --- No changes to your existing REST routes ---
  app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/export', exportRoutes);

  const llmServiceUrl = process.env.LLM_SERVICE_URL || 'http://llm-service:5001';

  app.post('/api/copilot-stream', async (req, res) => {
    console.log('[PROXY] Request received. Calling LLM service...');

    // Set headers for Server-Sent Events (SSE) immediately
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Flush headers to establish the connection

    try {
      const response = await axios({
        method: 'POST',
        url: `${llmServiceUrl}/api/v1/chat`,
        data: req.body,
        responseType: 'stream',
      });

      console.log('[PROXY] Connected to LLM service. Piping response...');

      // Pipe the raw data from the llm-service directly to the client
      response.data.pipe(res);

      req.on('close', () => {
        console.log('[PROXY] Client disconnected.');
        response.data.destroy(); // Ensure the downstream request is terminated
      });

    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error('[PROXY] FAILED to connect or proxy stream:', errorMessage);
      const errorPayload = { event: 'error', payload: 'AI service connection failed.' };
      res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
      res.end();
    }
  });
  // +++ END OF NEW SECTION +++

  // --- No changes to your existing GraphQL middleware ---
  // It is correctly placed after all other REST routes.
  app.use(
    '/api/graphql',
    expressMiddleware(server, { context: createContext })
  );

  const port = process.env.PORT || 4000;
  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));

  console.log(`🚀 GraphQL & Subscriptions ready at http://localhost:${port}/api/graphql`);
  console.log(`🚀 CoPilot streaming endpoint ready at http://localhost:${port}/api/copilot-stream`);
  startPostgresListener();
};

startServer();