// FILE: apps/web/middleware.ts
export { auth as middleware } from "@/auth";

// Optionally, you can add a matcher to specify which routes are protected:
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
