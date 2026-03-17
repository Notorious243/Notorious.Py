import React from 'react';
import { WidgetData } from '@/types/widget';

// ============================================================
// Figma-precise Smart Guides
// ============================================================

const GUIDE_COLOR = '#FF00FF';     // Figma magenta
const DISTANCE_COLOR = '#FF00FF';  // Figma magenta for distances
const CANVAS_CENTER_COLOR = '#FF00FF';
const THRESHOLD = 5;               // px tolerance for alignment detection
const DISTANCE_THRESHOLD = 150;    // max distance to show measurements
const EQUAL_SPACING_TOLERANCE = 3; // px tolerance for equal spacing

interface SmartGuidesProps {
  allWidgets: WidgetData[];
  canvasWidth: number;
  canvasHeight: number;
  onRegister?: (setter: (w: WidgetData | null) => void) => void;
}

interface GuideLine {
  orientation: 'v' | 'h';
  pos: number;       // x for vertical, y for horizontal
  start: number;     // start extent
  end: number;       // end extent
  isDashed?: boolean; // dashed for canvas center
}

interface DistanceMeasure {
  x1: number; y1: number;
  x2: number; y2: number;
  value: number;
  orientation: 'h' | 'v';
  isEqualSpacing?: boolean;
}

interface Rect {
  l: number; r: number; t: number; b: number;
  cx: number; cy: number;
}

function toRect(w: WidgetData): Rect {
  return {
    l: w.position.x, r: w.position.x + w.size.width,
    t: w.position.y, b: w.position.y + w.size.height,
    cx: w.position.x + w.size.width / 2,
    cy: w.position.y + w.size.height / 2,
  };
}

export const SmartGuides: React.FC<SmartGuidesProps> = ({
  allWidgets,
  canvasWidth,
  canvasHeight,
  onRegister,
}) => {
  // Internal state — updated directly via onRegister callback, NOT via Canvas re-renders
  const [draggedWidget, setDraggedWidget] = React.useState<WidgetData | null>(null);

  // Register the setter so external code can push drag updates directly
  React.useEffect(() => {
    onRegister?.(setDraggedWidget);
  }, [onRegister]);

  const result = React.useMemo(() => {
    if (!draggedWidget?.position || !draggedWidget?.size) return null;

    const others = allWidgets.filter(w =>
      w && w.id !== draggedWidget.id && !w.parentId && w.position && w.size
    );

    const d = toRect(draggedWidget);
    const guides: GuideLine[] = [];
    const distances: DistanceMeasure[] = [];

    // ========== CANVAS CENTER GUIDES ==========
    const canvasContentH = canvasHeight - 40;
    const ccx = canvasWidth / 2;
    const ccy = canvasContentH / 2;

    if (Math.abs(d.cx - ccx) < THRESHOLD) {
      guides.push({ orientation: 'v', pos: ccx, start: 0, end: canvasContentH, isDashed: true });
    }
    if (Math.abs(d.cy - ccy) < THRESHOLD) {
      guides.push({ orientation: 'h', pos: ccy, start: 0, end: canvasWidth, isDashed: true });
    }

    // ========== ALIGNMENT GUIDES WITH OTHER WIDGETS ==========
    for (const other of others) {
      const o = toRect(other);

      // Vertical guide checks (X-axis alignment)
      const vChecks: [number, number][] = [
        [d.l, o.l], [d.r, o.r],           // edge-edge
        [d.l, o.r], [d.r, o.l],           // cross-edge
        [d.cx, o.cx],                      // center-center
      ];

      for (const [dv, ov] of vChecks) {
        if (Math.abs(dv - ov) < THRESHOLD) {
          // Extent: from topmost to bottommost of both widgets
          const start = Math.min(d.t, o.t);
          const end = Math.max(d.b, o.b);
          guides.push({ orientation: 'v', pos: ov, start, end });
        }
      }

      // Horizontal guide checks (Y-axis alignment)
      const hChecks: [number, number][] = [
        [d.t, o.t], [d.b, o.b],           // edge-edge
        [d.t, o.b], [d.b, o.t],           // cross-edge
        [d.cy, o.cy],                      // center-center
      ];

      for (const [dv, ov] of hChecks) {
        if (Math.abs(dv - ov) < THRESHOLD) {
          const start = Math.min(d.l, o.l);
          const end = Math.max(d.r, o.r);
          guides.push({ orientation: 'h', pos: ov, start, end });
        }
      }

      // ========== DISTANCE MEASUREMENTS ==========
      const hOverlap = !(d.b < o.t || d.t > o.b);
      const vOverlap = !(d.r < o.l || d.l > o.r);

      if (hOverlap) {
        const midY = (Math.max(d.t, o.t) + Math.min(d.b, o.b)) / 2;
        if (d.l > o.r) {
          const dist = d.l - o.r;
          if (dist > 0 && dist < DISTANCE_THRESHOLD) {
            distances.push({ x1: o.r, y1: midY, x2: d.l, y2: midY, value: Math.round(dist), orientation: 'h' });
          }
        } else if (d.r < o.l) {
          const dist = o.l - d.r;
          if (dist > 0 && dist < DISTANCE_THRESHOLD) {
            distances.push({ x1: d.r, y1: midY, x2: o.l, y2: midY, value: Math.round(dist), orientation: 'h' });
          }
        }
      }

      if (vOverlap) {
        const midX = (Math.max(d.l, o.l) + Math.min(d.r, o.r)) / 2;
        if (d.t > o.b) {
          const dist = d.t - o.b;
          if (dist > 0 && dist < DISTANCE_THRESHOLD) {
            distances.push({ x1: midX, y1: o.b, x2: midX, y2: d.t, value: Math.round(dist), orientation: 'v' });
          }
        } else if (d.b < o.t) {
          const dist = o.t - d.b;
          if (dist > 0 && dist < DISTANCE_THRESHOLD) {
            distances.push({ x1: midX, y1: d.b, x2: midX, y2: o.t, value: Math.round(dist), orientation: 'v' });
          }
        }
      }
    }

    // ========== EQUAL SPACING DETECTION ==========
    // Horizontal equal spacing
    const allRects = [d, ...others.map(w => toRect(w))];
    const sortedX = [...allRects].sort((a, b) => a.l - b.l);
    const hGaps: { x1: number; x2: number; midY: number; value: number }[] = [];
    for (let i = 0; i < sortedX.length - 1; i++) {
      const a = sortedX[i], b = sortedX[i + 1];
      if (a.r < b.l) {
        const gap = b.l - a.r;
        const yOverlap = !(a.b < b.t || a.t > b.b);
        if (yOverlap && gap > 2 && gap < 300) {
          hGaps.push({ x1: a.r, x2: b.l, midY: (Math.max(a.t, b.t) + Math.min(a.b, b.b)) / 2, value: Math.round(gap) });
        }
      }
    }
    // Find equal gaps
    for (let i = 0; i < hGaps.length; i++) {
      for (let j = i + 1; j < hGaps.length; j++) {
        if (Math.abs(hGaps[i].value - hGaps[j].value) <= EQUAL_SPACING_TOLERANCE) {
          hGaps[i].value = hGaps[j].value; // normalize
          distances.push({ x1: hGaps[i].x1, y1: hGaps[i].midY, x2: hGaps[i].x2, y2: hGaps[i].midY, value: hGaps[i].value, orientation: 'h', isEqualSpacing: true });
          distances.push({ x1: hGaps[j].x1, y1: hGaps[j].midY, x2: hGaps[j].x2, y2: hGaps[j].midY, value: hGaps[j].value, orientation: 'h', isEqualSpacing: true });
        }
      }
    }

    // Vertical equal spacing
    const sortedY = [...allRects].sort((a, b) => a.t - b.t);
    const vGaps: { y1: number; y2: number; midX: number; value: number }[] = [];
    for (let i = 0; i < sortedY.length - 1; i++) {
      const a = sortedY[i], b = sortedY[i + 1];
      if (a.b < b.t) {
        const gap = b.t - a.b;
        const xOverlap = !(a.r < b.l || a.l > b.r);
        if (xOverlap && gap > 2 && gap < 300) {
          vGaps.push({ y1: a.b, y2: b.t, midX: (Math.max(a.l, b.l) + Math.min(a.r, b.r)) / 2, value: Math.round(gap) });
        }
      }
    }
    for (let i = 0; i < vGaps.length; i++) {
      for (let j = i + 1; j < vGaps.length; j++) {
        if (Math.abs(vGaps[i].value - vGaps[j].value) <= EQUAL_SPACING_TOLERANCE) {
          vGaps[i].value = vGaps[j].value;
          distances.push({ x1: vGaps[i].midX, y1: vGaps[i].y1, x2: vGaps[i].midX, y2: vGaps[i].y2, value: vGaps[i].value, orientation: 'v', isEqualSpacing: true });
          distances.push({ x1: vGaps[j].midX, y1: vGaps[j].y1, x2: vGaps[j].midX, y2: vGaps[j].y2, value: vGaps[j].value, orientation: 'v', isEqualSpacing: true });
        }
      }
    }

    // Deduplicate guides (merge overlapping ones at same position)
    const mergedGuides: GuideLine[] = [];
    for (const g of guides) {
      const existing = mergedGuides.find(
        m => m.orientation === g.orientation && Math.abs(m.pos - g.pos) < 1
      );
      if (existing) {
        existing.start = Math.min(existing.start, g.start);
        existing.end = Math.max(existing.end, g.end);
      } else {
        mergedGuides.push({ ...g });
      }
    }

    // Deduplicate distance measures
    const uniqueDistances: DistanceMeasure[] = [];
    for (const dm of distances) {
      const dup = uniqueDistances.find(
        u => Math.abs(u.x1 - dm.x1) < 2 && Math.abs(u.y1 - dm.y1) < 2 &&
          Math.abs(u.x2 - dm.x2) < 2 && Math.abs(u.y2 - dm.y2) < 2
      );
      if (!dup) uniqueDistances.push(dm);
    }

    return { guides: mergedGuides, distances: uniqueDistances };
  }, [draggedWidget, allWidgets, canvasWidth, canvasHeight]);

  if (!result || (result.guides.length === 0 && result.distances.length === 0)) return null;

  return (
    <svg
      className="absolute pointer-events-none"
      style={{ top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, overflow: 'visible' }}
    >
      {/* Guide lines */}
      {result.guides.map((g, i) => (
        <line
          key={`g-${i}`}
          x1={g.orientation === 'v' ? g.pos : g.start}
          y1={g.orientation === 'v' ? g.start : g.pos}
          x2={g.orientation === 'v' ? g.pos : g.end}
          y2={g.orientation === 'v' ? g.end : g.pos}
          stroke={g.isDashed ? CANVAS_CENTER_COLOR : GUIDE_COLOR}
          strokeWidth={1}
          strokeDasharray={g.isDashed ? '4 3' : 'none'}
          opacity={0.9}
        />
      ))}

      {/* Distance measurements */}
      {result.distances.map((dm, i) => {
        const isH = dm.orientation === 'h';
        const len = isH ? Math.abs(dm.x2 - dm.x1) : Math.abs(dm.y2 - dm.y1);
        const mx = (dm.x1 + dm.x2) / 2;
        const my = (dm.y1 + dm.y2) / 2;
        const color = dm.isEqualSpacing ? DISTANCE_COLOR : DISTANCE_COLOR;

        return (
          <g key={`d-${i}`}>
            {/* Main measurement line */}
            <line
              x1={dm.x1} y1={dm.y1} x2={dm.x2} y2={dm.y2}
              stroke={color} strokeWidth={1} opacity={0.85}
            />
            {/* End caps (perpendicular ticks) */}
            {isH ? (
              <>
                <line x1={dm.x1} y1={dm.y1 - 4} x2={dm.x1} y2={dm.y1 + 4} stroke={color} strokeWidth={1} opacity={0.85} />
                <line x1={dm.x2} y1={dm.y2 - 4} x2={dm.x2} y2={dm.y2 + 4} stroke={color} strokeWidth={1} opacity={0.85} />
              </>
            ) : (
              <>
                <line x1={dm.x1 - 4} y1={dm.y1} x2={dm.x1 + 4} y2={dm.y1} stroke={color} strokeWidth={1} opacity={0.85} />
                <line x1={dm.x2 - 4} y1={dm.y2} x2={dm.x2 + 4} y2={dm.y2} stroke={color} strokeWidth={1} opacity={0.85} />
              </>
            )}
            {/* Distance label pill */}
            {len > 15 && (
              <>
                <rect
                  x={mx - 16} y={my - 9}
                  width={32} height={18}
                  rx={4} ry={4}
                  fill={color} opacity={0.95}
                />
                <text
                  x={mx} y={my + 4}
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
