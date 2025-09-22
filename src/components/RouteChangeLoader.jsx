import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalLoader } from './GlobalLoader.jsx';

// Shows the global loader for at least 1s on every route change
export default function RouteChangeLoader({ minDurationMs = 1000 }) {
  const { pathname, search } = useLocation();
  const { start, stop } = useGlobalLoader();
  const isFirstRender = useRef(true);
  const previousPath = useRef(pathname);

  useEffect(() => {
    // Skip loader on initial page load to prevent infinite loading
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Only trigger loader if path actually changed
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      start();
      const timer = setTimeout(() => stop(), minDurationMs);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  return null;
}
