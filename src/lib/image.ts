const OPTIMIZABLE_HOSTS = new Set(["images.unsplash.com"]);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  try {
    OPTIMIZABLE_HOSTS.add(new URL(supabaseUrl).hostname);
  } catch {
    // ignore malformed env value
  }
}

/**
 * next/image can only optimize remote hosts declared in next.config.ts.
 * Hosts type arbitrary photo URLs today, so we optimize the ones we know
 * about and fall back to an unoptimized <img> for everything else rather
 * than erroring at request time.
 */
export function isOptimizableImage(url: string): boolean {
  try {
    return OPTIMIZABLE_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}
