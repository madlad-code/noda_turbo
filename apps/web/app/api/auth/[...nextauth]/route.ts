import { handlers } from "@/auth"; // Use the new central auth file

// The GET and POST handlers are now imported from our auth.ts file
export const { GET, POST } = handlers;