import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ── Production hardening ──────────────────────────────────────────────────
if (import.meta.env.PROD) {
  // Disable console output (keep console.error for critical debugging)
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};

  // Block right-click context menu
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Block common DevTools keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') { e.preventDefault(); return; }
    // Ctrl+Shift+I / Cmd+Option+I (Inspector)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) { e.preventDefault(); return; }
    // Ctrl+Shift+J / Cmd+Option+J (Console)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) { e.preventDefault(); return; }
    // Ctrl+Shift+C / Cmd+Option+C (Element picker)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) { e.preventDefault(); return; }
    // Ctrl+U / Cmd+U (View Source)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) { e.preventDefault(); return; }
  });

  // Detect DevTools opening via window size difference
  const detectDevTools = () => {
    const threshold = 160;
    const isOpen = (window.outerWidth - window.innerWidth > threshold) ||
                   (window.outerHeight - window.innerHeight > threshold);
    if (isOpen) {
      document.title = 'Notorious.PY';
    }
  };
  setInterval(detectDevTools, 2000);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
