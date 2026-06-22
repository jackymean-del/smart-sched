/**
 * Clerk configuration. Real authentication is active only when a publishable
 * key is provided (VITE_CLERK_PUBLISHABLE_KEY). Without it the app falls back
 * to the local mock auth store so dev/builds keep working.
 */
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
export const CLERK_ENABLED = !!CLERK_PUBLISHABLE_KEY
