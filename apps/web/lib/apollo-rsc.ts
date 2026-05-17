// FILE: apps/web/lib/apollo-rsc.ts
// PURPOSE: To create an Apollo Client for use in SERVER COMPONENTS ONLY.

import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { setContext } from '@apollo/client/link/context';
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc";
import { auth } from "@/auth";

export const { getClient } = registerApolloClient(() => {
  const uri = process.env.GRAPHQL_API_URL || 'http://localhost:4000/api/graphql';

  if (!uri.startsWith('http')) {
      throw new Error(`Invalid GRAPHQL_API_URL: "${uri}". It must be an absolute URL for server-side rendering.`);
  }

  const httpLink = new HttpLink({ uri });

  const authLink = setContext(async (_, { headers }) => {
    const session = await auth();
    // FIX: Correctly access the accessToken from the root of the session object,
    // as defined in your auth.ts callbacks.
    const token = session?.accessToken;

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      }
    }
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: authLink.concat(httpLink),
  });
});