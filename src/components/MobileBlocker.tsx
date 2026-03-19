import { useState, useEffect } from 'react';

const MIN_WIDTH = 1024;

export const MobileBlocker = () => {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const check = () => setBlocked(window.innerWidth < MIN_WIDTH);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!blocked) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #09090b 0%, #18181b 100%)',
        color: '#fafafa',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <img
        src="/logo-192x192.png"
        alt="Notorious.PY"
        style={{ width: 80, height: 80, borderRadius: 16, marginBottom: 24, boxShadow: '0 8px 32px rgba(99,102,241,0.25)' }}
      />
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
        Écran trop petit
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: '#a1a1aa', maxWidth: 360, margin: 0 }}>
        <strong style={{ color: '#e4e4e7' }}>Notorious.PY</strong> est conçu pour les ordinateurs.
        Veuillez utiliser un PC avec un écran d'au moins <strong style={{ color: '#e4e4e7' }}>1024 px</strong> de large.
      </p>
      <div
        style={{
          marginTop: 32,
          padding: '10px 20px',
          borderRadius: 10,
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.25)',
          fontSize: 12,
          color: '#818cf8',
        }}
      >
        Largeur actuelle : {typeof window !== 'undefined' ? window.innerWidth : '?'} px
      </div>
    </div>
  );
};
