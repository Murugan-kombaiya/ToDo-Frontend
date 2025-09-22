// Performance monitoring and optimization utilities

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
  }

  // Measure component render time
  measureRenderTime(componentName, renderFn) {
    const startTime = performance.now();

    const result = renderFn();

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    this.recordMetric(`render_${componentName}`, renderTime);

    // Log slow renders
    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }

    return result;
  }

  // Measure API call performance
  measureApiCall(endpoint, apiCallFn) {
    const startTime = performance.now();

    return apiCallFn()
      .then(result => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        this.recordMetric(`api_${endpoint}`, responseTime);

        // Log slow API calls
        if (responseTime > 1000) {
          console.warn(`Slow API call to ${endpoint}: ${responseTime.toFixed(2)}ms`);
        }

        return result;
      })
      .catch(error => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        this.recordMetric(`api_${endpoint}_error`, responseTime);

        // Log failed API calls
        console.error(`API call failed for ${endpoint}:`, error);

        throw error;
      });
  }

  // Measure memory usage
  measureMemoryUsage() {
    if ('memory' in performance) {
      const memoryInfo = performance.memory;
      this.recordMetric('memory_used', memoryInfo.usedJSHeapSize);
      this.recordMetric('memory_total', memoryInfo.totalJSHeapSize);
      this.recordMetric('memory_limit', memoryInfo.jsHeapSizeLimit);

      // Log high memory usage
      const usagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
      if (usagePercent > 80) {
        console.warn(`High memory usage: ${usagePercent.toFixed(1)}%`);
      }
    }
  }

  // Record custom metrics
  recordMetric(name, value) {
    this.metrics.set(name, {
      value,
      timestamp: Date.now()
    });

    // Store in localStorage for persistence (optional)
    try {
      const metricsData = JSON.stringify(Array.from(this.metrics.entries()));
      localStorage.setItem('performance_metrics', metricsData);
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  // Get metrics
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Clear old metrics
  clearMetrics() {
    this.metrics.clear();
    localStorage.removeItem('performance_metrics');
  }

  // Set up performance observer
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric('navigation_' + entry.name, entry.value);
        });
      });
      navObserver.observe({ type: 'navigation', buffered: true });

      // Observe paint timing
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric('paint_' + entry.name, entry.startTime);
        });
      });
      paintObserver.observe({ type: 'paint', buffered: true });

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric('lcp', entry.startTime);
        });
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // Observe first input delay
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric('fid', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      this.observers.push(navObserver, paintObserver, lcpObserver, fidObserver);
    }
  }

  // Clean up observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize performance monitoring
performanceMonitor.setupPerformanceObserver();

// React performance utilities
export const withPerformanceMonitoring = (componentName) => (Component) => {
  return React.memo((props) => {
    return performanceMonitor.measureRenderTime(componentName, () => (
      <Component {...props} />
    ));
  });
};

// API performance wrapper
export const withApiMonitoring = (endpoint) => (apiCall) => {
  return performanceMonitor.measureApiCall(endpoint, apiCall);
};

// Memory leak detection
export const detectMemoryLeaks = () => {
  const checkInterval = setInterval(() => {
    performanceMonitor.measureMemoryUsage();

    // Force garbage collection if available (Chrome DevTools)
    if (window.gc) {
      window.gc();
    }
  }, 30000); // Check every 30 seconds

  return () => clearInterval(checkInterval);
};

// Lazy loading utility
export const lazyLoadComponent = (importFn, fallback = null) => {
  const LazyComponent = React.lazy(() =>
    performanceMonitor.measureApiCall('lazy_import', importFn)
  );

  return (props) => (
    <React.Suspense fallback={fallback || <div>Loading...</div>}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

// Image optimization utilities
export const optimizeImage = (src, options = {}) => {
  const {
    width = null,
    height = null,
    quality = 80,
    format = 'webp'
  } = options;

  // In a real implementation, you would use a service like Cloudinary or ImageKit
  // For now, we'll just return the original src
  return src;
};

// Bundle analysis helper
export const analyzeBundle = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle Analysis:');
    console.log('- Main bundle size:', document.querySelector('script[src*="main."]')?.src);
    console.log('- Vendor bundle size:', document.querySelector('script[src*="vendor"]')?.src);

    // Log component sizes (approximate)
    const components = [
      'Dashboard', 'Tasks', 'Board', 'Pomodoro', 'Login', 'Register'
    ];

    components.forEach(component => {
      console.log(`- ${component} component loaded`);
    });
  }
};

// Debounced function for performance
export const debounced = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttled function for performance
export const throttled = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Virtual scrolling utility
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 0 });

  React.useEffect(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 2, items.length); // Add buffer

    setVisibleRange({ start, end });
  }, [scrollTop, items.length, itemHeight, containerHeight]);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    scrollTop,
    setScrollTop,
    offsetY: visibleRange.start * itemHeight
  };
};

// Code splitting helper
export const splitCode = {
  // Split by route
  routes: {
    Dashboard: () => import('../pages/Dashboard'),
    Tasks: () => import('../pages/Tasks'),
    Board: () => import('../pages/Board'),
    Pomodoro: () => import('../pages/Pomodoro')
  },

  // Split by feature
  features: {
    Auth: () => import('../components/AuthComponents'),
    TaskManagement: () => import('../components/TaskComponents'),
    Analytics: () => import('../components/AnalyticsComponents')
  }
};

// Performance reporting
export const reportPerformance = () => {
  const metrics = performanceMonitor.getMetrics();

  const report = {
    timestamp: Date.now(),
    pageLoadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
    domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
    firstPaint: metrics.paint_first_paint,
    firstContentfulPaint: metrics.paint_first_contentful_paint,
    largestContentfulPaint: metrics.lcp,
    firstInputDelay: metrics.fid,
    memoryUsage: metrics.memory_used,
    renderTimes: Object.fromEntries(
      Object.entries(metrics).filter(([key]) => key.startsWith('render_'))
    ),
    apiTimes: Object.fromEntries(
      Object.entries(metrics).filter(([key]) => key.startsWith('api_') && !key.includes('_error'))
    )
  };

  console.log('Performance Report:', report);

  // Send to analytics service in production
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
    console.log('Would send to analytics service:', report);
  }

  return report;
};

// Initialize performance monitoring on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      reportPerformance();
      detectMemoryLeaks();
    }, 1000);
  });
}

export default performanceMonitor;
