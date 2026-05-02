import { createClient } from '@supabase/supabase-js';

// Production Credentials (from your .env.local)
const PROD_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PROD_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Sandbox Credentials (You need to create a 2nd Supabase project and add these)
// Fallback to PROD if not set yet to prevent crashes during setup
const SANDBOX_URL = process.env.SANDBOX_SUPABASE_URL || PROD_URL;
const SANDBOX_KEY = process.env.SANDBOX_SERVICE_ROLE_KEY || PROD_KEY;

/**
 * Dynamically returns the correct Supabase client based on the environment flag.
 * In the future, this flag will be read from the user's session cookie.
 */
export function getDbClient(isSandbox: boolean = false) {
    if (isSandbox) {
        return createClient(SANDBOX_URL, SANDBOX_KEY);
    }
    return createClient(PROD_URL, PROD_KEY);
}

/**
 * Utility for background tasks that strictly require production.
 */
export const prodDb = createClient(PROD_URL, PROD_KEY);

/**
 * Utility for background tasks that strictly require sandbox.
 */
export const sandboxDb = createClient(SANDBOX_URL, SANDBOX_KEY);