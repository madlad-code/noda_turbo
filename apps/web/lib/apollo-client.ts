// FILE: apps/web/lib/apollo-client.ts
// PURPOSE: To create an Apollo Client for use in CLIENT COMPONENTS ONLY (the browser).
'use client';

import { HttpLink } from "@apollo/client";
import {
  NextSSRApolloClient,
  NextSSRInMemoryCache,
} from "@apollo/experimental-nextjs-app-support/ssr";
import { setContext } from '@apollo/client/link/context';
import { getSession } from "next-auth/react";

import type { ApolloClient } from "@apollo/client";

export function makeClient(): ApolloClient<any> {
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL || '/api/graphql',
  });

  const authLink = setContext(async (_, { headers }) => {
    const session = await getSession();
    // FIX: Correctly access the accessToken from the root of the session object,
    // as defined in your auth.ts callbacks.
    const token = session?.accessToken;

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  });

  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link: authLink.concat(httpLink),
  });
}