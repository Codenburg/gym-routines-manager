/**
 * Search-related types for unified search functionality
 */

// Search result types
export interface RoutineSearchItem {
  id: string;
  nombre: string;
  creador: string | null;
}

export interface TrainerSearchItem {
  nombre: string;
  count: number;
}

export interface UnifiedSearchResult {
  rutinas: RoutineSearchItem[];
  trainers: TrainerSearchItem[];
  message?: string;
}

// Active filters
export type FilterType = "entrenador";

export interface ActiveFilter {
  type: FilterType;
  value: string;
  label: string;
}

// Search params
export interface SearchParams {
  q?: string;
  search?: string;
  creador?: string;
  page?: number;
  limit?: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Autocomplete state
export interface AutocompleteState {
  isOpen: boolean;
  highlightedIndex: number;
  section: "rutinas" | "trainers" | null;
}
