/**
 * Estandariza el retorno de todas las funciones de data fetching.
 * Elimina la ambigüedad entre "no hay datos" y "hubo un error".
 */
export interface DataResult<T> {
  data: T;
  error: boolean;
}

/**
 * Crea un resultado exitoso (sin error)
 */
export function ok<T>(data: T): DataResult<T> {
  return { data, error: false };
}

/**
 * Crea un resultado con error (datos indisponibles)
 */
export function err<T>(data: T): DataResult<T> {
  return { data, error: true };
}
