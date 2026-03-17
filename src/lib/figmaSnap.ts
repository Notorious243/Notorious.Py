/**
 * Figma-style snap calculation for root widgets.
 * Detects edge, center, and cross-edge alignment with other widgets + canvas.
 */

export interface FigmaSnapResult {
  x: number;
  y: number;
  xSnapped: boolean;
  ySnapped: boolean;
}

const THRESHOLD = 5;

export function calculateFigmaSnap(
  dragX: number, dragY: number, dragW: number, dragH: number,
  others: { id: string; x: number; y: number; w: number; h: number }[],
  canvasW: number, canvasH: number
): FigmaSnapResult {
  // Dragged widget edges & center
  const dl = dragX, dr = dragX + dragW, dcx = dragX + dragW / 2;
  const dt = dragY, db = dragY + dragH, dcy = dragY + dragH / 2;

  // Collect X candidates
  const xCandidates: { offset: number }[] = [];
  // Collect Y candidates
  const yCandidates: { offset: number }[] = [];

  for (const o of others) {
    const ol = o.x, or2 = o.x + o.w, ocx = o.x + o.w / 2;
    const ot = o.y, ob = o.y + o.h, ocy = o.y + o.h / 2;

    // X alignments: left-left, right-right, center-center, left-right, right-left
    xCandidates.push({ offset: ol - dl });       // left-left
    xCandidates.push({ offset: or2 - dr });      // right-right
    xCandidates.push({ offset: ocx - dcx });     // center-center
    xCandidates.push({ offset: or2 - dl });      // left to other's right
    xCandidates.push({ offset: ol - dr });       // right to other's left

    // Y alignments
    yCandidates.push({ offset: ot - dt });       // top-top
    yCandidates.push({ offset: ob - db });       // bottom-bottom
    yCandidates.push({ offset: ocy - dcy });     // center-center
    yCandidates.push({ offset: ob - dt });       // top to other's bottom
    yCandidates.push({ offset: ot - db });       // bottom to other's top
  }

  // Canvas center & edges
  xCandidates.push({ offset: 0 - dl });                   // canvas left
  xCandidates.push({ offset: canvasW - dr });              // canvas right
  xCandidates.push({ offset: canvasW / 2 - dcx });        // canvas center X
  yCandidates.push({ offset: 0 - dt });                   // canvas top
  yCandidates.push({ offset: canvasH - db });              // canvas bottom
  yCandidates.push({ offset: canvasH / 2 - dcy });        // canvas center Y

  // Find best X snap
  let bestX: number | null = null;
  let bestXDist = Infinity;
  for (const c of xCandidates) {
    const d = Math.abs(c.offset);
    if (d <= THRESHOLD && d < bestXDist) {
      bestXDist = d;
      bestX = c.offset;
    }
  }

  // Find best Y snap
  let bestY: number | null = null;
  let bestYDist = Infinity;
  for (const c of yCandidates) {
    const d = Math.abs(c.offset);
    if (d <= THRESHOLD && d < bestYDist) {
      bestYDist = d;
      bestY = c.offset;
    }
  }

  return {
    x: bestX !== null ? dragX + bestX : dragX,
    y: bestY !== null ? dragY + bestY : dragY,
    xSnapped: bestX !== null,
    ySnapped: bestY !== null,
  };
}
