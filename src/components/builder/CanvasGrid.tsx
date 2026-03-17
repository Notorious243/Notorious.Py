import React from 'react';

interface CanvasGridProps {
  width: number;
  height: number;
  scale: number;
}

export const CanvasGrid: React.FC<CanvasGridProps> = ({ width, height, scale }) => {
  const gridSize = 20 * scale;
  
  return (
    <svg
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none text-slate-300/80 dark:text-white/5"
    >
      <defs>
        <pattern
          id="grid"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
};
