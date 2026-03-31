import React from 'react';
import type { FrameSmartGuidesData } from '@/components/builder/frameSmartGuidesUtils';

const GUIDE_COLOR = '#FF00FF';

interface FrameSmartGuidesDisplayProps {
  data: FrameSmartGuidesData;
  parentBounds: { left: number; top: number; width: number; height: number };
  widgetAbsPos: { x: number; y: number };
}

export const FrameSmartGuidesDisplay: React.FC<FrameSmartGuidesDisplayProps> = ({
  data,
  parentBounds,
  widgetAbsPos,
}) => {
  const { guides, distances } = data;
  if (guides.length === 0 && distances.length === 0) return null;

  const offsetX = -(widgetAbsPos.x - parentBounds.left);
  const offsetY = -(widgetAbsPos.y - parentBounds.top);

  return (
    <svg
      className="pointer-events-none"
      style={{
        position: 'absolute',
        left: offsetX,
        top: offsetY,
        width: parentBounds.width,
        height: parentBounds.height,
        overflow: 'visible',
        zIndex: 1000,
      }}
    >
      {guides.map((g, i) => {
        const relPos = g.orientation === 'v' ? g.pos - parentBounds.left : g.pos - parentBounds.top;
        const relStart = g.orientation === 'v' ? g.start - parentBounds.top : g.start - parentBounds.left;
        const relEnd = g.orientation === 'v' ? g.end - parentBounds.top : g.end - parentBounds.left;

        return (
          <line
            key={`g-${i}`}
            x1={g.orientation === 'v' ? relPos : relStart}
            y1={g.orientation === 'v' ? relStart : relPos}
            x2={g.orientation === 'v' ? relPos : relEnd}
            y2={g.orientation === 'v' ? relEnd : relPos}
            stroke={GUIDE_COLOR}
            strokeWidth={1}
            strokeDasharray={g.isDashed ? '4 3' : 'none'}
            opacity={0.9}
          />
        );
      })}

      {distances.map((dm, i) => {
        const relX1 = dm.x1 - parentBounds.left;
        const relY1 = dm.y1 - parentBounds.top;
        const relX2 = dm.x2 - parentBounds.left;
        const relY2 = dm.y2 - parentBounds.top;
        const isHorizontal = dm.orientation === 'h';
        const len = isHorizontal ? Math.abs(relX2 - relX1) : Math.abs(relY2 - relY1);
        const mx = (relX1 + relX2) / 2;
        const my = (relY1 + relY2) / 2;

        return (
          <g key={`d-${i}`}>
            <line x1={relX1} y1={relY1} x2={relX2} y2={relY2} stroke={GUIDE_COLOR} strokeWidth={1} opacity={0.85} />
            {isHorizontal ? (
              <>
                <line x1={relX1} y1={relY1 - 4} x2={relX1} y2={relY1 + 4} stroke={GUIDE_COLOR} strokeWidth={1} opacity={0.85} />
                <line x1={relX2} y1={relY2 - 4} x2={relX2} y2={relY2 + 4} stroke={GUIDE_COLOR} strokeWidth={1} opacity={0.85} />
              </>
            ) : (
              <>
                <line x1={relX1 - 4} y1={relY1} x2={relX1 + 4} y2={relY1} stroke={GUIDE_COLOR} strokeWidth={1} opacity={0.85} />
                <line x1={relX2 - 4} y1={relY2} x2={relX2 + 4} y2={relY2} stroke={GUIDE_COLOR} strokeWidth={1} opacity={0.85} />
              </>
            )}
            {len > 8 && (
              <>
                <rect x={mx - 16} y={my - 9} width={32} height={18} rx={4} ry={4} fill={GUIDE_COLOR} opacity={0.95} />
                <text
                  x={mx}
                  y={my + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize={10}
                  fontWeight={600}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  style={{ userSelect: 'none' }}
                >
                  {dm.value}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};
