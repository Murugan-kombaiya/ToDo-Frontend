import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalLoader } from './GlobalLoader.jsx';

// Shows the global loader for at least 1s on every route change
export default function RouteChangeLoader({ minDurationMs = 1000 }) {
  const { pathname, search } = useLocation();
  const { start, stop } = useGlobalLoader();

  useEffect(() => {
    // Trigger loader immediately on route change
    start();
    const timer = setTimeout(() => stop(), minDurationMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  return null;
}
