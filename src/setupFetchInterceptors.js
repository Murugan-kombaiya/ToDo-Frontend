// Patch window.fetch as early as possible so every request triggers the loader
// Uses a tiny bus so the React provider can supply the start/stop handlers later
import { loaderStart, loaderStop } from './components/LoaderBus';

if (typeof window !== 'undefined' && !window.__FETCH_WRAPPED__) {
  const original = window.fetch ? window.fetch.bind(window) : null;
  if (original) {
    window.__FETCH_WRAPPED__ = true;
    window.fetch = async (...args) => {
      // Skip loader for certain URLs to prevent issues
      const url = args[0];
      const skipLoader = typeof url === 'string' && (
        url.includes('/socket.io') || // Skip for socket.io polling
        url.includes('hot-update') || // Skip for webpack hot reload
        url.includes('webpack')       // Skip for webpack dev server
      );
      
      if (skipLoader) {
        return original(...args);
      }
      
      try {
        loaderStart();
        const res = await original(...args);  
        return res;
      } catch (err) {
        throw err;
      } finally {
        loaderStop();
      }
    };
  }
}
