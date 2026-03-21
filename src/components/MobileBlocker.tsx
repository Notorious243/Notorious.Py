import { useState, useEffect } from 'react';
import { Monitor, X } from 'lucide-react';

const REAL_WIDTH_THRESHOLD = 1024;

export const MobileBlocker = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = () => {
      const realWidth = window.screen.width;
      setVisible(realWidth < REAL_WIDTH_THRESHOLD);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!visible || dismissed) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        width: 'calc(100% - 32px)',
        maxWidth: 420,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 16,
          padding: '20px 20px 18px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
          color: '#e2e8f0',
        }}
      >
        <button
          onClick={() => setDismissed(true)}
          aria-label="Fermer"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: 8,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#94a3b8',
          }}
        >
          <X size={14} />
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(99,102,241,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Monitor size={20} color="#818cf8" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
              Optimisé pour les grands écrans
            </p>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#94a3b8' }}>
              <strong style={{ color: '#cbd5e1' }}>Notorious.PY</strong> est un outil de bureau.
              Pour une meilleure expérience, utilisez un ordinateur.
            </p>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          style={{
            marginTop: 14,
            width: '100%',
            height: 36,
            borderRadius: 10,
            border: '1px solid rgba(99,102,241,0.3)',
            background: 'rgba(99,102,241,0.1)',
            color: '#a5b4fc',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          J'ai compris, continuer quand même
        </button>
      </div>
    </div>
  );
};
