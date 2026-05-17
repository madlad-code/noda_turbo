// apps/graphql-api/src/auth/index.ts
import { Router } from 'express';

const router: Router = Router();

// =================================================================
// All routes in this file are now deprecated and have been removed.
// =================================================================
// The /register endpoint is no longer needed because user creation is managed by the organization's Active Directory administrator.
// The /login endpoint is no longer needed because the authentication flow is now handled by the Next.js frontend and Auth.js,
// which redirect the user to Microsoft's login page.
//
// The backend now receives a bearer token directly from the frontend proxy with each GraphQL request.
// The validation for this token is handled in the GraphQL context (`src/graphql/context.ts`).
// =================================================================

console.log("Authentication routes at /api/auth/* are deprecated and will be removed in a future version.");

export default router;
