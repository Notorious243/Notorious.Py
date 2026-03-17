/**
 * FrameSmartGuides — Figma-identical smart guides for child widgets inside Frames.
 * Shows alignment guide lines (with proper extents spanning both widgets)
 * + distance measurement pills between siblings.
 */

import React from 'react';
import { WidgetData } from '@/types/widget';

// ============================================================
// CONFIG
// ============================================================

const GUIDE_COLOR = '#FF00FF';     // Figma magenta
const THRESHOLD = 5;               // px tolerance for alignment detection
const DISTANCE_THRESHOLD = 300;    // max gap to show measurements

// ============================================================
// TYPES
// ============================================================

export interface FrameGuide {
  orientation: 'v' | 'h';
  pos: number;       // absolute position (x for vertical, y for horizontal)
  start: number;     // start extent (absolute)
  end: number;       // end extent (absolute)
  isDashed?: boolean;
}

export interface FrameDistance {
  x1: number; y1: number;
  x2: number; y2: number;
  value: number;
  orientation: 'h' | 'v';
}

export interface FrameSmartGuidesData {
  guides: FrameGuide[];
  distances: FrameDistance[];
}

// ============================================================
// COMPUTATION
// ============================================================

interface Rect {
  l: number; r: number; t: number; b: number;
  cx: number; cy: number;
}

function toRect(x: number, y: number, w: number, h: number): Rect {
  return { l: x, r: x + w, t: y, b: y + h, cx: x + w / 2, cy: y + h / 2 };
}

/**
 * Compute Figma-style smart guides between a widget and its siblings inside a frame.
 * Returns guide lines with proper extents + distance measurements.
 * All coordinates are ABSOLUTE (canvas-space).
 */
export function computeFrameSmartGuides(
  widgetRect: { x: number; y: number; width: number; height: number },
  siblings: WidgetData[],
  parentBounds: { left: number; top: number; width: number; height: number }
): FrameSmartGuidesData {
  const d = toRect(widgetRect.x, widgetRect.y, widgetRect.width, widgetRect.height);
  const guides: FrameGuide[] = [];
  const distances: FrameDistance[] = [];

  // ========== PARENT CENTER GUIDES ==========
  const pcx = parentBounds.left + parentBounds.width / 2;
  const pcy = parentBounds.top + parentBounds.height / 2;

  if (Math.abs(d.cx - pcx) < THRESHOLD) {
    guides.push({ orientation: 'v', pos: pcx, start: parentBounds.top, end: parentBounds.top + parentBounds.height, isDashed: true });
  }
  if (Math.abs(d.cy - pcy) < THRESHOLD) {
    guides.push({ orientation: 'h', pos: pcy, start: parentBounds.left, end: parentBounds.left + parentBounds.width, isDashed: true });
  }

  // ========== ALIGNMENT GUIDES WITH SIBLINGS ==========
  for (const sib of siblings) {
    const o = toRect(sib.position.x, sib.position.y, sib.size.width, sib.size.height);

    // Vertical guide checks (X-axis alignment)
    const vChecks: [number, number][] = [
      [d.l, o.l], [d.r, o.r],           // edge-edge
      [d.l, o.r], [d.r, o.l],           // cross-edge
      [d.cx, o.cx],                      // center-center
    ];

    for (const [dv, ov] of vChecks) {
      if (Math.abs(dv - ov) < THRESHOLD) {
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

  // ========== DEDUPLICATE ==========
  const mergedGuides: FrameGuide[] = [];
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

  const uniqueDistances: FrameDistance[] = [];
  for (const dm of distances) {
    const dup = uniqueDistances.find(
      u => Math.abs(u.x1 - dm.x1) < 2 && Math.abs(u.y1 - dm.y1) < 2 &&
        Math.abs(u.x2 - dm.x2) < 2 && Math.abs(u.y2 - dm.y2) < 2
    );
    if (!dup) uniqueDistances.push(dm);
  }

  return { guides: mergedGuides, distances: uniqueDistances };
}

// ============================================================
// RENDERING COMPONENT
// ============================================================

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

  // Offset SVG origin to the parent frame's content area origin
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
      {/* Guide lines */}
      {guides.map((g, i) => {
        // Convert absolute coords to relative-to-parentBounds
        const relPos = g.orientation === 'v'
          ? g.pos - parentBounds.left
          : g.pos - parentBounds.top;
        const relStart = g.orientation === 'v'
          ? g.start - parentBounds.top
          : g.start - parentBounds.left;
        const relEnd = g.orientation === 'v'
          ? g.end - parentBounds.top
          : g.end - parentBounds.left;

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

      {/* Distance measurements */}
      {distances.map((dm, i) => {
        const relX1 = dm.x1 - parentBounds.left;
        const relY1 = dm.y1 - parentBounds.top;
        const relX2 = dm.x2 - parentBounds.left;
        const relY2 = dm.y2 - parentBounds.top;
        const isH = dm.orientation === 'h';
        const len = isH ? Math.abs(relX2 - relX1) : Math.abs(relY2 - relY1);
        const mx = (relX1 + relX2) / 2;
        const my = (relY1 + relY2) / 2;

        return (
          <g key={`d-${i}`}>
            {/* Main measurement line */}
            <line
              x1={relX1} y1={relY1} x2={relX2} y2={relY2}
              stroke={GUIDE_COLOR} strokeWidth={1} opacity={0.85}
            />
            {/* End caps (perpendicular ticks) */}
            {isH ? (
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
            {/* Distance label pill */}
            {len > 8 && (
              <>
                <rect
                  x={mx - 16} y={my - 9}
                  width={32} height={18}
                  rx={4} ry={4}
                  fill={GUIDE_COLOR} opacity={0.95}
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
