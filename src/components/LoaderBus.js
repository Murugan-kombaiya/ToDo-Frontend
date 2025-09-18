// Simple bus to connect a global fetch wrapper (installed before React renders)
// with the GlobalLoaderProvider's start/stop handlers.

let handlers = {
  start: null,
  stop: null,
};

export function setLoaderHandlers(start, stop) {
  handlers.start = typeof start === 'function' ? start : null;
  handlers.stop = typeof stop === 'function' ? stop : null;
}

export function loaderStart() {
  if (handlers.start) handlers.start();
}

export function loaderStop() {
  if (handlers.stop) handlers.stop();
}
