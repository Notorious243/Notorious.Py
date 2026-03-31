import { WidgetData } from '@/types/widget';

const THRESHOLD = 5;
const DISTANCE_THRESHOLD = 300;

export interface FrameGuide {
  orientation: 'v' | 'h';
  pos: number;
  start: number;
  end: number;
  isDashed?: boolean;
}

export interface FrameDistance {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  value: number;
  orientation: 'h' | 'v';
}

export interface FrameSmartGuidesData {
  guides: FrameGuide[];
  distances: FrameDistance[];
}

interface Rect {
  l: number;
  r: number;
  t: number;
  b: number;
  cx: number;
  cy: number;
}

const toRect = (x: number, y: number, w: number, h: number): Rect => ({
  l: x,
  r: x + w,
  t: y,
  b: y + h,
  cx: x + w / 2,
  cy: y + h / 2,
});

export function computeFrameSmartGuides(
  widgetRect: { x: number; y: number; width: number; height: number },
  siblings: WidgetData[],
  parentBounds: { left: number; top: number; width: number; height: number }
): FrameSmartGuidesData {
  const d = toRect(widgetRect.x, widgetRect.y, widgetRect.width, widgetRect.height);
  const guides: FrameGuide[] = [];
  const distances: FrameDistance[] = [];

  const pcx = parentBounds.left + parentBounds.width / 2;
  const pcy = parentBounds.top + parentBounds.height / 2;

  if (Math.abs(d.cx - pcx) < THRESHOLD) {
    guides.push({
      orientation: 'v',
      pos: pcx,
      start: parentBounds.top,
      end: parentBounds.top + parentBounds.height,
      isDashed: true,
    });
  }
  if (Math.abs(d.cy - pcy) < THRESHOLD) {
    guides.push({
      orientation: 'h',
      pos: pcy,
      start: parentBounds.left,
      end: parentBounds.left + parentBounds.width,
      isDashed: true,
    });
  }

  for (const sib of siblings) {
    const o = toRect(sib.position.x, sib.position.y, sib.size.width, sib.size.height);

    const vChecks: [number, number][] = [
      [d.l, o.l],
      [d.r, o.r],
      [d.l, o.r],
      [d.r, o.l],
      [d.cx, o.cx],
    ];

    for (const [dv, ov] of vChecks) {
      if (Math.abs(dv - ov) < THRESHOLD) {
        const start = Math.min(d.t, o.t);
        const end = Math.max(d.b, o.b);
        guides.push({ orientation: 'v', pos: ov, start, end });
      }
    }

    const hChecks: [number, number][] = [
      [d.t, o.t],
      [d.b, o.b],
      [d.t, o.b],
      [d.b, o.t],
      [d.cy, o.cy],
    ];

    for (const [dv, ov] of hChecks) {
      if (Math.abs(dv - ov) < THRESHOLD) {
        const start = Math.min(d.l, o.l);
        const end = Math.max(d.r, o.r);
        guides.push({ orientation: 'h', pos: ov, start, end });
      }
    }

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

  const mergedGuides: FrameGuide[] = [];
  for (const g of guides) {
    const existing = mergedGuides.find(
      (m) => m.orientation === g.orientation && Math.abs(m.pos - g.pos) < 1
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
    const duplicate = uniqueDistances.find(
      (u) =>
        Math.abs(u.x1 - dm.x1) < 2 &&
        Math.abs(u.y1 - dm.y1) < 2 &&
        Math.abs(u.x2 - dm.x2) < 2 &&
        Math.abs(u.y2 - dm.y2) < 2
    );
    if (!duplicate) uniqueDistances.push(dm);
  }

  return { guides: mergedGuides, distances: uniqueDistances };
}
