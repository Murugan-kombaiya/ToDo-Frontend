import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { setLoaderHandlers } from './LoaderBus';

const GlobalLoaderContext = createContext({});

export const useGlobalLoader = () => useContext(GlobalLoaderContext);

/*
  GlobalLoaderProvider intercepts window.fetch to automatically show a
  full-screen, colorful loading overlay while network requests are in-flight.

  Rules:
  - Minimum visible time: 1000ms (1 second) for better perceived performance
  - If backend takes longer than 1s, the overlay stays up until all requests complete
  - Supports concurrent fetches via an internal active counter
*/
export default function GlobalLoaderProvider({ children, minDurationMs = 1000 }) {
  const [visible, setVisible] = useState(false);
  const activeCountRef = useRef(0);
  const firstStartAtRef = useRef(0);

  const start = useCallback(() => {
    const now = Date.now();
    if (activeCountRef.current === 0) {
      firstStartAtRef.current = now;
      setVisible(true);
    }
    activeCountRef.current += 1;
  }, []);

  const stop = useCallback(() => {
    if (activeCountRef.current > 0) {
      activeCountRef.current -= 1;
    }
    if (activeCountRef.current === 0) {
      const elapsed = Date.now() - firstStartAtRef.current;
      const remain = Math.max(0, minDurationMs - elapsed);
      // Enforce minimum visible time
      window.setTimeout(() => setVisible(false), remain);
    }
  }, [minDurationMs]);
  
  // Add safety timeout to prevent infinite loading
  useEffect(() => {
    if (visible) {
      const safetyTimeout = setTimeout(() => {
        console.warn('GlobalLoader: Safety timeout triggered after 10s');
        activeCountRef.current = 0;
        setVisible(false);
      }, 10000); // 10 second safety timeout
      
      return () => clearTimeout(safetyTimeout);
    }
  }, [visible]);

  useEffect(() => {
    // Register start/stop with the bus so the global fetch interceptor can call them
    setLoaderHandlers(start, stop);
  }, [start, stop]);

  return (
    <GlobalLoaderContext.Provider value={{ start, stop, visible }}>
      {children}
      {visible && <LoaderOverlay />}
    </GlobalLoaderContext.Provider>
  );
}

function LoaderOverlay() {
  return (
    <div className="global-loader-overlay">
      <div className="loader-balls">
        <span className="ball ball-1" />
        <span className="ball ball-2" />
        <span className="ball ball-3" />
        <span className="ball ball-4" />
        <span className="ball ball-5" />
      </div>
      <div className="loader-ring">
        <div />
        <div />
        <div />
        <div />
      </div>
    </div>
  );
}
