import type { RoutineSearchItem, TrainerSearchItem } from "@/types/search";

/**
 * Priority levels for search ranking
 * Lower number = higher priority
 */
const enum RankingPriority {
  EXACT_NAME = 1,
  PARTIAL_NAME = 2,
  EXACT_TRAINER = 3,
  PARTIAL_TRAINER = 4,
}

/**
 * Rank a single routine based on how well it matches the query
 */
function getRankingPriority(item: RoutineSearchItem, query: string): number {
  const lowerQuery = query.toLowerCase().trim();
  const lowerName = item.nombre.toLowerCase();
  const lowerCreator = (item.creador || "").toLowerCase();

  // Exact match in name (case-insensitive)
  if (lowerName === lowerQuery) {
    return RankingPriority.EXACT_NAME;
  }

  // Partial match in name
  if (lowerName.includes(lowerQuery)) {
    return RankingPriority.PARTIAL_NAME;
  }

  // Exact match in creator
  if (lowerCreator === lowerQuery) {
    return RankingPriority.EXACT_TRAINER;
  }

  // Partial match in creator
  if (lowerCreator.includes(lowerQuery)) {
    return RankingPriority.PARTIAL_TRAINER;
  }

  // No match - shouldn't happen if filtered correctly
  return 99;
}

/**
 * Rank search results by relevance
 * Priority order:
 * 1. Exact match in routine.nombre
 * 2. Partial match in routine.nombre
 * 3. Exact match in trainer.nombre
 * 4. Partial match in trainer.nombre
 */
export function rankSearchResults(
  results: RoutineSearchItem[],
  query: string
): RoutineSearchItem[] {
  if (!query.trim()) {
    return results;
  }

  return [...results].sort((a, b) => {
    const priorityA = getRankingPriority(a, query);
    const priorityB = getRankingPriority(b, query);

    // If same priority, sort alphabetically
    if (priorityA === priorityB) {
      return a.nombre.localeCompare(b.nombre);
    }

    return priorityA - priorityB;
  });
}

/**
 * Group routines by trainer and return unique trainers with count
 */
export function groupByTrainer(
  routines: RoutineSearchItem[]
): TrainerSearchItem[] {
  const trainerMap = new Map<string, number>();

  for (const routine of routines) {
    if (routine.creador) {
      const current = trainerMap.get(routine.creador) || 0;
      trainerMap.set(routine.creador, current + 1);
    }
  }

  return Array.from(trainerMap.entries())
    .map(([nombre, count]) => ({ nombre, count }))
    .sort((a, b) => b.count - a.count || a.nombre.localeCompare(b.nombre));
}

/**
 * Check if query matches a string (case-insensitive)
 */
export function matchesQuery(text: string | null, query: string): boolean {
  if (!text || !query.trim()) return false;
  return text.toLowerCase().includes(query.toLowerCase().trim());
}

/**
 * Filter routines that match the query in either nombre or creador
 */
export function filterRoutinesByQuery(
  routines: RoutineSearchItem[],
  query: string
): RoutineSearchItem[] {
  if (!query.trim()) return routines;

  const lowerQuery = query.toLowerCase().trim();

  return routines.filter(
    (routine) =>
      routine.nombre.toLowerCase().includes(lowerQuery) ||
      (routine.creador && routine.creador.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
