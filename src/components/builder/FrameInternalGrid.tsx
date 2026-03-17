/**
 * FrameInternalGrid - Grille interne spécifique aux conteneurs (frame, scrollableframe, tabview)
 * Visuellement distincte du système de snap principal (cyan/teal au lieu de violet)
 * S'affiche uniquement quand un enfant est en cours de déplacement
 */

import React from 'react';
import { useTheme } from 'next-themes';

interface FrameInternalGridProps {
  width: number;
  height: number;
  gridSize?: number;
  show: boolean;
}

export const FrameInternalGrid: React.FC<FrameInternalGridProps> = ({
  width,
  height,
  show,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (!show || width <= 0 || height <= 0) return null;

  const centerLineColor = isDark
    ? 'rgba(20, 184, 166, 0.45)'
    : 'rgba(13, 148, 136, 0.35)';

  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ zIndex: 5 }}
    >
      {/* Ligne centrale verticale */}
      <line
        x1={centerX}
        y1={0}
        x2={centerX}
        y2={height}
        stroke={centerLineColor}
        strokeWidth={1}
        strokeDasharray="5 4"
      />

      {/* Ligne centrale horizontale */}
      <line
        x1={0}
        y1={centerY}
        x2={width}
        y2={centerY}
        stroke={centerLineColor}
        strokeWidth={1}
        strokeDasharray="5 4"
      />
    </svg>
  );
};
