import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully intercept and ignore benign Vite HMR/Websocket connection issues
if (typeof window !== 'undefined') {
  const isWebSocketError = (err: any) => {
    if (!err) return false;
    const msg = String(err.message || err.description || err);
    return msg.toLowerCase().includes('websocket');
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isWebSocketError(event.reason)) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (isWebSocketError(event.error) || isWebSocketError(event.message)) {
      event.preventDefault();
    }
  }, true);

  // Dynamically intercept fetch connections to add Authorization JWT Bearer tokens 
  // from localStorage when third-party cookie blocking prevents secure cookie handshakes.
  try {
    const originalFetch = window.fetch;
    if (originalFetch) {
      const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const token = localStorage.getItem("aura_jwt_token");
        if (token) {
          let isApi = false;
          if (typeof input === "string") {
            isApi = input.startsWith("/api/");
          } else if (input instanceof URL) {
            isApi = input.pathname.startsWith("/api/");
          } else if (input && typeof input === "object" && 'url' in input) {
            const urlStr = (input as any).url || "";
            isApi = urlStr.startsWith("/api/") || urlStr.startsWith(window.location.origin + "/api/");
          }

          if (isApi) {
            const newInit = { ...init };
            const headers = new Headers(newInit.headers || {});
            if (!headers.has("Authorization")) {
              headers.set("Authorization", `Bearer ${token}`);
            }
            newInit.headers = headers;
            init = newInit;
          }
        }
        return originalFetch(input, init);
      };

      try {
        window.fetch = customFetch;
      } catch (e) {
        // Fallback: use Object.defineProperty if direct assignment is blocked as read-only
        Object.defineProperty(window, 'fetch', {
          value: customFetch,
          writable: true,
          configurable: true
        });
      }
    }
  } catch (err) {
    console.warn("Unable to intercept window.fetch securely:", err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

