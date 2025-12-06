import { lazy, ComponentType } from 'react';

// Session storage key for tracking page refresh state
const PAGE_REFRESHED_KEY = 'sg360_page_refreshed';

/**
 * A wrapper around React.lazy that adds retry logic with cache-busting.
 * This helps handle cases where a deployment invalidates chunk hashes.
 * 
 * When a chunk fails to load:
 * 1. First retry: retry the import
 * 2. Second retry: clears service worker caches and retries
 * 3. Third retry: final attempt before triggering a page reload
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  maxRetries: number = 3
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const pageAlreadyRefreshed = sessionStorage.getItem(PAGE_REFRESHED_KEY) === 'true';
    let lastError: any;

    // First attempt
    try {
      const result = await componentImport();
      // Clear the refresh flag on successful load
      sessionStorage.removeItem(PAGE_REFRESHED_KEY);
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Check if this is a chunk load failure
      const isChunkError = 
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.message?.includes('error loading dynamically imported module') ||
        error?.name === 'ChunkLoadError';

      if (!isChunkError) {
        throw error;
      }
    }

    // Retry attempts
    for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
      try {
        // On second retry, try clearing the SW cache
        if (retryCount === 1) {
          await clearServiceWorkerCaches();
        }
        
        // Add a small delay before retry
        await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
        
        const result = await componentImport();
        // Clear the refresh flag on successful load
        sessionStorage.removeItem(PAGE_REFRESHED_KEY);
        return result;
      } catch (retryError) {
        lastError = retryError;
        // Continue to next retry
      }
    }

    // All retries failed - trigger a page reload if we haven't already
    if (!pageAlreadyRefreshed) {
      sessionStorage.setItem(PAGE_REFRESHED_KEY, 'true');
      // Clear all caches and reload
      await clearServiceWorkerCaches();
      window.location.reload();
      // Return a promise that rejects after a delay to prevent rendering issues
      // The page will reload before this resolves/rejects
      await new Promise((_, reject) => setTimeout(() => reject(lastError), 5000));
    }
    
    // Already tried reloading once, throw the error to show error UI
    throw lastError;
  });
}

/**
 * Clears all service worker caches
 */
async function clearServiceWorkerCaches(): Promise<void> {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    } catch (e) {
      console.warn('Failed to clear caches:', e);
    }
  }
  
  // Also unregister service workers if possible
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    } catch (e) {
      console.warn('Failed to unregister service workers:', e);
    }
  }
}

export default lazyWithRetry;
