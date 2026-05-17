// apps/web/app/api/graphql/route.ts
import { auth } from "@/auth"; // Import the auth function from our central auth.ts file
import { type NextRequest } from "next/server";

// Helper function to get the backend URL from environment variables
const getBackendGraphQLUrl = () => {
  const backendUrl =
    process.env.BACKEND_GRAPHQL_API_URL || "http://localhost:4000/api/graphql";
  console.log(`[GraphQL Proxy] Using backend URL: ${backendUrl}`);
  return backendUrl;
};

// This function will handle both GET and POST requests to avoid code duplication
async function handler(request: NextRequest) {
  try {
    const backendGraphQLUrl = getBackendGraphQLUrl();
    const headers = new Headers(request.headers);

    // Get the session object from Auth.js. This contains the user's session and the accessToken.
    const session = await auth();

    // Check if the session and accessToken exist
    if (session?.accessToken) {
      headers.set("Authorization", `Bearer ${session.accessToken}`);
      console.log("[GraphQL Proxy] Set Authorization header from Auth.js session.");
    } else {
      console.log("[GraphQL Proxy] No active session found. Forwarding request without Authorization header.");
      headers.delete("Authorization");
    }

    // Clean up headers before forwarding
    headers.set("Content-Type", "application/json");
    headers.delete("host");
    headers.delete("connection");

    // Handle POST requests (GraphQL mutations/queries)
    if (request.method === "POST") {
      const requestBody = await request.json();
      console.log(
        "[GraphQL Proxy] Forwarding GraphQL query:",
        JSON.stringify(requestBody, null, 2),
      );

      const backendResponse = await fetch(backendGraphQLUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      return backendResponse; // Directly return the response from the backend
    }

    // Handle GET requests (can be used for GraphQL introspection, etc.)
    if (request.method === "GET") {
        const url = new URL(request.url);
        const backendUrlWithParams = new URL(backendGraphQLUrl);
        url.searchParams.forEach((value, key) => {
          backendUrlWithParams.searchParams.append(key, value);
        });

        const backendResponse = await fetch(backendUrlWithParams.toString(), {
            method: 'GET',
            headers: headers,
        });

        return backendResponse; // Directly return the response from the backend
    }

    // If not GET or POST, return a 405 Method Not Allowed
    return new Response("Method Not Allowed", { status: 405 });

  } catch (error) {
    console.error(`API route /api/graphql (proxy ${request.method}) caught an exception:`, error);
    // Ensure you are running the `graphql-api` service. The ECONNREFUSED error means the connection was refused.
    if (error.cause?.code === 'ECONNREFUSED') {
        return new Response(
            JSON.stringify({ errors: [{ message: "Could not connect to the backend GraphQL service. Please ensure it is running." }] }),
            { status: 503, headers: { 'Content-Type': 'application/json' } } // 503 Service Unavailable
        );
    }

    return new Response(
      JSON.stringify({ errors: [{ message: `GraphQL proxy error: ${error.message}` }] }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export { handler as GET, handler as POST };