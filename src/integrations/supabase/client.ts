import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

const log = logger('supabase-client');

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 2;

async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const method = init?.method || 'GET';
  const url = typeof input === 'string' ? input : input.toString();
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const startedAt = performance.now();

    try {
      log.debug('Supabase request', { method, url, attempt });
      const response = await fetch(input, init);
      const elapsedMs = Math.round(performance.now() - startedAt);

      log.debug('Supabase response', {
        method,
        url,
        status: response.status,
        elapsedMs,
        attempt,
      });

      if (RETRYABLE_STATUS.has(response.status) && attempt < MAX_RETRIES) {
        log.warn('Retrying Supabase request due to status code', {
          method,
          url,
          status: response.status,
          attempt,
        });
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt >= MAX_RETRIES) {
        break;
      }

      log.warn('Retrying Supabase request due to network error', {
        method,
        url,
        attempt,
        error,
      });
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }

  log.error('Supabase request failed after retries', { method, url, error: lastError });
  throw lastError instanceof Error ? lastError : new Error('Network request failed');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  global: {
    fetch: fetchWithRetry,
  },
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});