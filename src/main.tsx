import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (import.meta.env.PROD && typeof window !== 'undefined') {
  const emitTelemetry = (detail: Record<string, unknown>) => {
    window.dispatchEvent(
      new CustomEvent('app-telemetry', {
        detail: {
          domain: 'runtime',
          ...detail,
        },
      }),
    );
  };

  window.addEventListener('error', (event) => {
    emitTelemetry({
      level: 'error',
      action: 'window_error',
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    emitTelemetry({
      level: 'error',
      action: 'unhandled_rejection',
      reason: String(event.reason ?? 'unknown'),
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
