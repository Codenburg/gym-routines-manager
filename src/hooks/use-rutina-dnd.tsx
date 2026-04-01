"use client";

import { useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type CollisionDetection,
  type AutoScrollOptions,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";

import {
  reorderDias,
  reorderEjerciciosSameDia,
  moveEjercicioToAnotherDia,
  type DragItem,
  type DragEndResult,
} from "@/lib/dnd-utils";

/**
 * Props for the useRutinaDnd hook.
 * The hook provides DnD logic, but state updates go to RHF via props callbacks
 * (unidirectional sync: DnD -> RHF).
 */
export interface UseRutinaDndProps {
  /**
   * Called when a drag operation ends with a valid reorder.
   * The component should use this to update RHF state via useFieldArray.move()
   */
  onDragEnd?: (result: DragEndResult) => void;
  /**
   * Optional custom collision detection strategy.
   * Defaults to closestCenter.
   */
  collisionDetection?: CollisionDetection;
  /**
   * Optional auto-scroll configuration.
   * Defaults to sensible values for lists.
   */
  autoScroll?: AutoScrollOptions | false;
}

/**
 * Return type for the useRutinaDnd hook.
 */
export interface UseRutinaDndReturn {
  /** Currently dragged item, or null if not dragging */
  activeItem: DragItem | null;
  /** ID of the item being hovered over during drag */
  activeOver: string | null;
  /** Sensor configuration for DndContext */
  sensors: ReturnType<typeof useSensors>;
  /** Collision detection strategy */
  collisionDetection: CollisionDetection;
  /** Auto-scroll configuration */
  autoScroll: AutoScrollOptions | false;
  /** Drag event handlers for DndContext */
  handlers: {
    onDragStart: (event: DragStartEvent) => void;
    onDragOver: (event: DragOverEvent) => void;
    onDragEnd: (event: DragEndEvent) => void;
  };
  /**
   * Render function for DragOverlay content.
   * Call this inside DragOverlay's children render function.
   * Uses Portal to render outside the form DOM hierarchy.
   */
  renderDragOverlay: (item: DragItem, children: React.ReactNode) => React.ReactPortal;
  /** The DndContext component with all configuration */
  DndProvider: typeof DndContext;
}

/**
 * Drag preview component for days - rendered in DragOverlay.
 * Motion state: scale(1.02) + rotate(1deg) + enhanced shadow
 */
function DiaDragOverlay({ diaIndex }: { diaIndex: number }) {
  return (
    <div className="day-card-overlay px-4 py-3 min-w-[200px]">
      <div className="flex items-center gap-2">
        {/* Visual indicator without numbering - order is shown by position */}
        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
          <GripVertical className="h-3 w-3 text-accent" />
        </div>
        <span className="font-medium text-foreground">
          Día {diaIndex + 1}
        </span>
      </div>
    </div>
  );
}

/**
 * Drag preview component for exercises - rendered in DragOverlay.
 * Motion state: scale(1.01) + rotate(0.5deg) + enhanced shadow
 */
function EjercicioDragOverlay({ nombre }: { nombre?: string }) {
  return (
    <div className="ejercicio-row-overlay px-3 py-2 min-w-[180px]">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-accent shrink-0" />
        <span className="text-sm text-foreground truncate max-w-[150px]">
          {nombre || "Ejercicio"}
        </span>
      </div>
    </div>
  );
}

/**
 * Custom hook encapsulating DnD logic for rutina creation/editing.
 *
 * Provides:
 * - Sensor configuration (PointerSensor with 8px activation distance, KeyboardSensor)
 * - closestCenter collision detection strategy
 * - Auto-scroll with sensible defaults
 * - Stable callbacks (useCallback) for drag events
 * - DragOverlay rendering with Portal support
 *
 * This hook manages internal DnD state (activeItem, activeOver) but delegates
 * state updates to the parent component via callbacks (unidirectional sync).
 */
export function useRutinaDnd({
  onDragEnd,
  collisionDetection: customCollisionDetection,
  autoScroll: customAutoScroll,
}: UseRutinaDndProps = {}): UseRutinaDndReturn {
  // Internal DnD state - tracks what's being dragged and what's being hovered
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);
  const [activeOver, setActiveOver] = useState<string | null>(null);

  // Memoized auto-scroll configuration with sensible defaults for lists
  // Smoother scrolling: lower acceleration + higher threshold = less jerky movement
  const autoScroll = useMemo<AutoScrollOptions | false>(
    () =>
      customAutoScroll ?? {
        acceleration: 0.5, // reduced from 10 - very slow for small forms
        threshold: { x: 50, y: 50 },
        layoutShift: true,
      },
    [customAutoScroll]
  );

  // Memoized collision detection strategy
  const collisionDetection = useMemo<CollisionDetection>(
    () => customCollisionDetection ?? closestCenter,
    [customCollisionDetection]
  );

  // Configure sensors with proper activation constraints
  // PointerSensor: 15px distance prevents accidental drags (finger tremor, click hesitation)
  // Higher distance = less likely to trigger on small movements = smoother feel
  // KeyboardSensor: enables accessibility - drag with keyboard arrows
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 15, // increased from 8 - prevents accidental activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      scrollBehavior: "smooth",
    })
  );

  /**
   * handleDragStart - Called when user starts dragging an item.
   * Sets the activeItem from the event data.
   *
   * NOTE: event.active.data.current only contains { type, diaId } - NOT the sortable id.
   * The sortable id is in event.active.id. We must merge both.
   */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const baseData = event.active.data.current as DragItem;
    const dragItem: DragItem = {
      ...baseData,
      id: event.active.id as string,
    };
    setActiveItem(dragItem);
    setActiveOver(null);
  }, []);

  /**
   * handleDragOver - Called continuously while dragging over another item.
   * Used for cross-container detection (same day vs different day for ejercicios).
   *
   * Cross-day ejercicio moves are NOT blocked here (that happens in handleDragEnd),
   * but we could show visual feedback here in the future.
   */
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      setActiveOver(event.over?.id as string | null ?? null);
    },
    []
  );

  /**
   * handleDragEnd - Called when drag operation completes.
   *
   * LAYER SEPARATION:
   * - This hook handles DnD logic and hierarchical resolution
   * - The form's onDragEnd receives pre-resolved, normalized data
   * - No loops between DnD state and RHF state
   *
   * Flow for DAY drags:
   * 1. If dropped on same item, do nothing
   * 2. If dropped on DAY → direct reorder
   * 3. If dropped on EJERCICIO → resolve parent DAY → reorder
   *
   * Flow for EJERCICIO drags:
   * 1. If same day → allow reorder
   * 2. If different day → block (cross-day not allowed)
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // No valid drop target - cancelled or dropped outside
      if (!over) {
        setActiveItem(null);
        setActiveOver(null);
        return;
      }

      // Dropped on itself - no reorder needed
      if (active.id === over.id) {
        setActiveItem(null);
        setActiveOver(null);
        return;
      }

      // NOTE: event.active.data.current only has { type, diaId } - NOT the sortable id.
      // The sortable id is in event.active.id. Must merge both.
      const baseActiveData = active.data.current as DragItem;
      const activeData: DragItem = {
        ...baseActiveData,
        id: active.id as string,
      };
      const overData = over.data.current as DragItem | undefined;

      if (!overData) {
        setActiveItem(null);
        setActiveOver(null);
        return;
      }

      // ========== EXPLICIT GUARD: DAY DRAGS ==========
      // Only enter here if explicitly dragging a day
      // Ejercicio drags are handled separately below
      if (activeData.type === "dia") {
        // HIERARCHICAL RESOLUTION: When dropping on an ejercicio,
        // resolve to its parent day container
        let resolvedOver: DragItem;

        if (overData.type === "ejercicio") {
          // Extract parent day ID from ejercicio's sortable ID
          // Fall back to diaId if regex fails (for UUID-based IDs)
          const overId = over.id as string;
          const parentMatch = overId.match(/^(dias\[\d+\])/);

          if (parentMatch) {
            resolvedOver = {
              type: "dia",
              id: parentMatch[1],
              diaId: parentMatch[1],
            };
          } else if (overData.diaId) {
            resolvedOver = {
              type: "dia",
              id: overData.diaId,
              diaId: overData.diaId,
            };
          } else {
            // Cannot resolve - this shouldn't happen
            setActiveItem(null);
            setActiveOver(null);
            return;
          }
        } else {
          // Dropping directly on a day: overData only has { type, diaId }
          // but DragItem needs { type, id, diaId } - merge with over.id
          resolvedOver = {
            type: overData.type,
            id: over.id as string,
            diaId: overData.diaId ?? (over.id as string),
          };
        }

        const result: DragEndResult = {
          active: activeData,
          over: resolvedOver,
        };

        onDragEnd?.(result);

        setActiveItem(null);
        setActiveOver(null);
        return;
      }

      // ========== EJERCICIO DRAGS ==========
      if (activeData.type === "ejercicio") {
        // Check if cross-day (BLOCKED)
        if (activeData.diaId !== overData.diaId) {
          const blockedResult = moveEjercicioToAnotherDia(
            activeData.diaId ?? "",
            overData.diaId ?? "",
            activeData.id
          );

          if (blockedResult.blocked) {
            onDragEnd?.({
              active: activeData,
              over: { ...overData, blocked: true } as any,
            });
          }
        } else {
          // Same day - allowed
          // NOTE: overData from over.data.current only has { type, diaId }, missing id
          // The actual sortable id is in over.id - merge it in
          const resolvedOver: DragItem = {
            ...overData,
            id: over.id as string,
          };
          const result: DragEndResult = {
            active: activeData,
            over: resolvedOver,
          };

          onDragEnd?.(result);
        }
      }

      // Reset internal state
      setActiveItem(null);
      setActiveOver(null);
    },
    [onDragEnd]
  );

  /**
   * Renders drag overlay content using React Portal.
   * This ensures the dragged preview is outside the form DOM hierarchy,
   * preventing z-index and stacking context issues.
   *
   * @param item - The DragItem being dragged
   * @param children - The React content to render in the overlay
   * @returns React Portal rendering the children
   */
  const renderDragOverlay = useCallback(
    (item: DragItem, children: React.ReactNode): React.ReactPortal => {
      return createPortal(children, document.body);
    },
    []
  );

  // Memoized handlers object for DndContext
  const handlers = useMemo(
    () => ({
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
    }),
    [handleDragStart, handleDragOver, handleDragEnd]
  );

  return {
    activeItem,
    activeOver,
    sensors,
    collisionDetection,
    autoScroll,
    handlers,
    renderDragOverlay,
    DndProvider: DndContext,
  };
}

/**
 * Extracts the array index from a RHF field id.
 * RHF useFieldArray generates ids like "dias[0]" or "dias[0].ejercicios[2]"
 */
export function getIndexFromRHFId(id: string): number {
  const match = id.match(/\[(\d+)\]/);
  return match ? parseInt(match[1], 10) : 0;
}
