/**
 * SnapEngine - Système de snap intelligent unifié
 * Inspiré de Figma pour une expérience professionnelle
 */

import { WidgetData, CanvasSettings } from '@/types/widget';
import { getParentContentBounds } from './widgetLayout';

// ========================================
// TYPES
// ========================================

export interface DistanceMeasure {
  orientation: 'h' | 'v';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  value: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
  distances: DistanceMeasure[];
}

export interface SnapGuide {
  type: 'vertical' | 'horizontal';
  position: number; // Position absolue de la ligne
  color: string;
  label?: string;
}

export interface SnapPoint {
  value: number;
  type: 'grid' | 'center' | 'edge' | 'sibling';
  priority: number;
  label?: string;
}

// ========================================
// CONFIGURATION
// ========================================

const SNAP_CONFIG = {
  // Distances de snap (en pixels)
  THRESHOLD: 8,           // Distance max pour snapper
  GRID_SIZE: 10,          // Taille de la grille

  // Priorités (plus haut = plus prioritaire)
  PRIORITY: {
    CENTER: 100,          // Centre du conteneur/canvas
    EDGE: 80,             // Bords du conteneur/canvas
    SIBLING: 60,          // Alignement avec autres widgets
    GRID: 40,             // Grille
  },

  // Couleurs des guides
  COLORS: {
    CENTER: '#0F3460',    // Navy - Centre
    EDGE: '#1F5AA0',      // Navy clair - Bords
    SIBLING: '#EC4899',   // Rose - Alignement widgets
    GRID: '#6B7280',      // Gris - Grille
  },

  // Distance minimale avant activation du snap
  MIN_MOVEMENT: 5,        // px
};

// ========================================
// SNAP ENGINE - CLASSE PRINCIPALE
// ========================================

export class SnapEngine {
  private widget: WidgetData;
  private allWidgets: WidgetData[];
  private canvasSettings: CanvasSettings;
  private dragStartPos: { x: number; y: number } | null = null;

  constructor(
    widget: WidgetData,
    allWidgets: WidgetData[],
    canvasSettings: CanvasSettings
  ) {
    this.widget = widget;
    this.allWidgets = allWidgets;
    this.canvasSettings = canvasSettings;
  }

  /**
   * Enregistrer la position de départ du drag
   */
  startDrag(position: { x: number; y: number }): void {
    this.dragStartPos = position;
  }

  /**
   * Vérifier si le widget a assez bougé pour activer le snap
   */
  hasMovedEnough(currentPosition: { x: number; y: number }): boolean {
    if (!this.dragStartPos) return false;

    const distance = Math.sqrt(
      Math.pow(currentPosition.x - this.dragStartPos.x, 2) +
      Math.pow(currentPosition.y - this.dragStartPos.y, 2)
    );

    return distance >= SNAP_CONFIG.MIN_MOVEMENT;
  }

  /**
   * Calculer le snap pour la position donnée
   * Retourne la position snappée et les guides à afficher
   */
  calculateSnap(position: { x: number; y: number }): SnapResult {
    // Si pas assez bougé, pas de snap
    if (!this.hasMovedEnough(position)) {
      return {
        x: position.x,
        y: position.y,
        guides: [],
        distances: [],
      };
    }

    // Déterminer le contexte (widget enfant ou root)
    const isChild = !!this.widget.parentId;

    if (isChild) {
      return this.calculateChildSnap(position);
    } else {
      return this.calculateRootSnap(position);
    }
  }

  /**
   * Snap pour un widget enfant dans un conteneur
   */
  private calculateChildSnap(position: { x: number; y: number }): SnapResult {
    const parentBounds = getParentContentBounds(
      this.allWidgets,
      this.widget.parentId!,
      this.canvasSettings
    );

    const xSnapPoints: SnapPoint[] = [];
    const ySnapPoints: SnapPoint[] = [];

    // 1. Centre du conteneur (PRIORITÉ MAX)
    const containerCenterX = parentBounds.left + parentBounds.width / 2;
    const containerCenterY = parentBounds.top + parentBounds.height / 2;

    xSnapPoints.push({
      value: containerCenterX - this.widget.size.width / 2,
      type: 'center',
      priority: SNAP_CONFIG.PRIORITY.CENTER,
      label: 'Centre H',
    });

    ySnapPoints.push({
      value: containerCenterY - this.widget.size.height / 2,
      type: 'center',
      priority: SNAP_CONFIG.PRIORITY.CENTER,
      label: 'Centre V',
    });

    // 2. Alignement avec les widgets frères
    const siblings = this.allWidgets.filter(
      w => w.parentId === this.widget.parentId && w.id !== this.widget.id
    );

    for (const sibling of siblings) {
      const sibCenterX = sibling.position.x + sibling.size.width / 2;
      const sibCenterY = sibling.position.y + sibling.size.height / 2;

      // Center-to-center alignment
      xSnapPoints.push({ value: sibCenterX - this.widget.size.width / 2, type: 'sibling', priority: SNAP_CONFIG.PRIORITY.SIBLING });
      ySnapPoints.push({ value: sibCenterY - this.widget.size.height / 2, type: 'sibling', priority: SNAP_CONFIG.PRIORITY.SIBLING });

      // Left edge alignment
      xSnapPoints.push({ value: sibling.position.x, type: 'sibling', priority: SNAP_CONFIG.PRIORITY.SIBLING });
      // Right edge alignment
      xSnapPoints.push({ value: sibling.position.x + sibling.size.width - this.widget.size.width, type: 'sibling', priority: SNAP_CONFIG.PRIORITY.SIBLING });
      // Top edge alignment
      ySnapPoints.push({ value: sibling.position.y, type: 'sibling', priority: SNAP_CONFIG.PRIORITY.SIBLING });
      // Bottom edge alignment
      ySnapPoints.push({ value: sibling.position.y + sibling.size.height - this.widget.size.height, type: 'sibling', priority: SNAP_CONFIG.PRIORITY.SIBLING });
    }

    // Trouver le meilleur snap pour X et Y
    const snappedX = this.findBestSnap(position.x, xSnapPoints);
    const snappedY = this.findBestSnap(position.y, ySnapPoints);

    // Générer les guides visuels
    const guides = this.generateGuides(snappedX, snappedY, position);

    // Calculer les distances entre widgets
    const distances = this.calculateDistances(
      { x: snappedX.value, y: snappedY.value },
      siblings
    );

    return {
      x: snappedX.value,
      y: snappedY.value,
      guides,
      distances,
    };
  }

  /**
   * Snap pour un widget root sur le canvas
   */
  private calculateRootSnap(position: { x: number; y: number }): SnapResult {
    return {
      x: position.x,
      y: position.y,
      guides: [],
      distances: [],
    };
  }

  /**
   * Calculer les distances entre le widget dragé et ses frères
   */
  private calculateDistances(
    pos: { x: number; y: number },
    siblings: WidgetData[]
  ): DistanceMeasure[] {
    const distances: DistanceMeasure[] = [];
    const w = this.widget.size.width;
    const h = this.widget.size.height;

    for (const sib of siblings) {
      const sl = sib.position.x;
      const sr = sl + sib.size.width;
      const st = sib.position.y;
      const sb = st + sib.size.height;
      const dl = pos.x;
      const dr = dl + w;
      const dt = pos.y;
      const db = dt + h;

      // Horizontal overlap check (for vertical distance)
      const hOverlap = dl < sr && dr > sl;
      // Vertical overlap check (for horizontal distance)
      const vOverlap = dt < sb && db > st;

      if (hOverlap) {
        const midX = (Math.max(dl, sl) + Math.min(dr, sr)) / 2;
        // Widget is below sibling
        if (dt > sb) {
          const dist = dt - sb;
          if (dist > 0 && dist < 300) {
            distances.push({ orientation: 'v', x1: midX, y1: sb, x2: midX, y2: dt, value: Math.round(dist) });
          }
        }
        // Widget is above sibling
        else if (db < st) {
          const dist = st - db;
          if (dist > 0 && dist < 300) {
            distances.push({ orientation: 'v', x1: midX, y1: db, x2: midX, y2: st, value: Math.round(dist) });
          }
        }
      }

      if (vOverlap) {
        const midY = (Math.max(dt, st) + Math.min(db, sb)) / 2;
        // Widget is to the right of sibling
        if (dl > sr) {
          const dist = dl - sr;
          if (dist > 0 && dist < 300) {
            distances.push({ orientation: 'h', x1: sr, y1: midY, x2: dl, y2: midY, value: Math.round(dist) });
          }
        }
        // Widget is to the left of sibling
        else if (dr < sl) {
          const dist = sl - dr;
          if (dist > 0 && dist < 300) {
            distances.push({ orientation: 'h', x1: dr, y1: midY, x2: sl, y2: midY, value: Math.round(dist) });
          }
        }
      }
    }

    return distances;
  }

  /**
   * Trouver le meilleur point de snap parmi une liste
   */
  private findBestSnap(currentValue: number, snapPoints: SnapPoint[]): SnapPoint {
    // Filter points within the snap threshold
    const validPoints = snapPoints.filter(p => Math.abs(currentValue - p.value) <= SNAP_CONFIG.THRESHOLD);

    if (validPoints.length === 0) {
      return { value: currentValue, type: 'grid', priority: 0 };
    }

    // Find the highest priority among valid points
    const highestPriority = Math.max(...validPoints.map(p => p.priority));

    // Filter only points that have the highest priority
    const topPriorityPoints = validPoints.filter(p => p.priority === highestPriority);

    // Among the highest priority points, find the one closest to current value
    let bestSnap = topPriorityPoints[0];
    let bestDistance = Math.abs(currentValue - bestSnap.value);

    for (let i = 1; i < topPriorityPoints.length; i++) {
      const point = topPriorityPoints[i];
      const distance = Math.abs(currentValue - point.value);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestSnap = point;
      }
    }

    return bestSnap;
  }

  /**
   * Générer les guides visuels pour les snaps actifs
   */
  private generateGuides(
    snappedX: SnapPoint,
    snappedY: SnapPoint,
    originalPosition: { x: number; y: number }
  ): SnapGuide[] {
    const guides: SnapGuide[] = [];

    // Guide vertical (si snap X actif)
    if (Math.abs(snappedX.value - originalPosition.x) > 0.5) {
      const centerX = snappedX.value + this.widget.size.width / 2;
      guides.push({
        type: 'vertical',
        position: centerX,
        color: this.getColorForSnapType(snappedX.type),
        label: snappedX.label,
      });
    }

    // Guide horizontal (si snap Y actif)
    if (Math.abs(snappedY.value - originalPosition.y) > 0.5) {
      const centerY = snappedY.value + this.widget.size.height / 2;
      guides.push({
        type: 'horizontal',
        position: centerY,
        color: this.getColorForSnapType(snappedY.type),
        label: snappedY.label,
      });
    }

    return guides;
  }

  /**
   * Obtenir la couleur selon le type de snap
   */
  private getColorForSnapType(type: string): string {
    switch (type) {
      case 'center':
        return SNAP_CONFIG.COLORS.CENTER;
      case 'edge':
        return SNAP_CONFIG.COLORS.EDGE;
      case 'sibling':
        return SNAP_CONFIG.COLORS.SIBLING;
      case 'grid':
        return SNAP_CONFIG.COLORS.GRID;
      default:
        return SNAP_CONFIG.COLORS.GRID;
    }
  }

  /**
   * Réinitialiser l'état du drag
   */
  endDrag(): void {
    this.dragStartPos = null;
  }

  // ========================================
  // RESIZE SNAP — Figma-style edge alignment
  // ========================================

  /**
   * Calculate snap during a resize operation.
   * Detects when a moving edge aligns with sibling/parent/canvas edges in real-time.
   */
  calculateResizeSnap(
    rect: { x: number; y: number; width: number; height: number },
    movingEdges: { left: boolean; right: boolean; top: boolean; bottom: boolean }
  ): ResizeSnapResult {
    const guides: SnapGuide[] = [];
    let { x, y, width, height } = rect;

    // Collect reference edges from siblings and parent/canvas
    const xEdges: { value: number; sourceId?: string }[] = [];
    const yEdges: { value: number; sourceId?: string }[] = [];

    const isChild = !!this.widget.parentId;

    // 1. Sibling edges (same-level widgets)
    const siblings = isChild
      ? this.allWidgets.filter(w => w.parentId === this.widget.parentId && w.id !== this.widget.id)
      : this.allWidgets.filter(w => !w.parentId && w.id !== this.widget.id);

    for (const sib of siblings) {
      const sl = sib.position.x;
      const sr = sib.position.x + sib.size.width;
      const scx = sib.position.x + sib.size.width / 2;
      const st = sib.position.y;
      const sb = sib.position.y + sib.size.height;
      const scy = sib.position.y + sib.size.height / 2;

      xEdges.push({ value: sl, sourceId: sib.id });
      xEdges.push({ value: sr, sourceId: sib.id });
      xEdges.push({ value: scx, sourceId: sib.id });
      yEdges.push({ value: st, sourceId: sib.id });
      yEdges.push({ value: sb, sourceId: sib.id });
      yEdges.push({ value: scy, sourceId: sib.id });
    }

    // 2. Parent/canvas boundary edges
    if (isChild) {
      const pb = getParentContentBounds(this.allWidgets, this.widget.parentId!, this.canvasSettings);
      xEdges.push({ value: pb.left });
      xEdges.push({ value: pb.left + pb.width });
      xEdges.push({ value: pb.left + pb.width / 2 });
      yEdges.push({ value: pb.top });
      yEdges.push({ value: pb.top + pb.height });
      yEdges.push({ value: pb.top + pb.height / 2 });
    } else {
      const cH = Math.max(0, this.canvasSettings.height - 40);
      xEdges.push({ value: 0 });
      xEdges.push({ value: this.canvasSettings.width });
      xEdges.push({ value: this.canvasSettings.width / 2 });
      yEdges.push({ value: 0 });
      yEdges.push({ value: cH });
      yEdges.push({ value: cH / 2 });
    }

    // Also add this widget's own center/opposite-edge for "same width" detection
    // e.g. when resizing right, detect if left+width matches a sibling's right edge

    const T = SNAP_CONFIG.THRESHOLD;

    // --- Right edge snap ---
    if (movingEdges.right) {
      const rightEdge = x + width;
      const best = findClosestEdge(rightEdge, xEdges, T);
      if (best !== null) {
        width = best.value - x;
        guides.push({ type: 'vertical', position: best.value, color: SNAP_CONFIG.COLORS.SIBLING });
      }
    }

    // --- Left edge snap ---
    if (movingEdges.left) {
      const leftEdge = x;
      const best = findClosestEdge(leftEdge, xEdges, T);
      if (best !== null) {
        const oldRight = x + width;
        x = best.value;
        width = oldRight - x;
        guides.push({ type: 'vertical', position: best.value, color: SNAP_CONFIG.COLORS.SIBLING });
      }
    }

    // --- Bottom edge snap ---
    if (movingEdges.bottom) {
      const bottomEdge = y + height;
      const best = findClosestEdge(bottomEdge, yEdges, T);
      if (best !== null) {
        height = best.value - y;
        guides.push({ type: 'horizontal', position: best.value, color: SNAP_CONFIG.COLORS.SIBLING });
      }
    }

    // --- Top edge snap ---
    if (movingEdges.top) {
      const topEdge = y;
      const best = findClosestEdge(topEdge, yEdges, T);
      if (best !== null) {
        const oldBottom = y + height;
        y = best.value;
        height = oldBottom - y;
        guides.push({ type: 'horizontal', position: best.value, color: SNAP_CONFIG.COLORS.SIBLING });
      }
    }

    // Enforce minimum size
    if (width < 20) width = 20;
    if (height < 20) height = 20;

    return { x, y, width, height, guides };
  }
}

// ========================================
// RESIZE SNAP RESULT TYPE
// ========================================

export interface ResizeSnapResult {
  x: number;
  y: number;
  width: number;
  height: number;
  guides: SnapGuide[];
}

/**
 * Find the closest edge within threshold
 */
function findClosestEdge(
  currentEdge: number,
  edges: { value: number; sourceId?: string }[],
  threshold: number
): { value: number; sourceId?: string } | null {
  let best: { value: number; sourceId?: string } | null = null;
  let bestDist = Infinity;
  for (const edge of edges) {
    const dist = Math.abs(currentEdge - edge.value);
    if (dist <= threshold && dist < bestDist) {
      bestDist = dist;
      best = edge;
    }
  }
  return best;
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Créer une instance du SnapEngine
 */
export function createSnapEngine(
  widget: WidgetData,
  allWidgets: WidgetData[],
  canvasSettings: CanvasSettings
): SnapEngine {
  return new SnapEngine(widget, allWidgets, canvasSettings);
}
