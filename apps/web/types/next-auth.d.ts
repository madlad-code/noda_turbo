import 'next-auth';

/**
 * Extends the default `next-auth` Session and JWT types to include
 * the custom properties we are adding in the auth.ts configuration,
 * such as the accessToken.
 */
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user?: {
      id?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
  }
}
