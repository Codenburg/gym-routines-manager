/**
 * Unit tests for useFeriadosNotification hook.
 *
 * Slice 1 cutover removed the legacy `/api/feriados/latest` public REST
 * dependency. The hook now consumes the server-provided latest holiday date.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFeriadosNotification } from '@/hooks/use-feriados-notification'

const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((_key: string): string | null => localStorageMock.store[_key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageMock.store[key] = value }),
  removeItem: vi.fn((key: string) => { delete localStorageMock.store[key] }),
  clear: vi.fn(() => { localStorageMock.store = {} }),
  get length() { return Object.keys(localStorageMock.store).length },
  key: vi.fn((i: number) => Object.keys(localStorageMock.store)[i] ?? null),
}

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('useFeriadosNotification Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.store = {}
  })

  it('sets hasNew to false when latestFeriadoDate equals lastSeen', async () => {
    const sameDate = '2026-03-25T00:00:00.000Z'
    localStorageMock.getItem.mockReturnValueOnce(sameDate)

    const { result } = renderHook(() => useFeriadosNotification(sameDate, 'iron-gym'))

    await waitFor(() => expect(result.current.latestFeriadoDate).toBe(sameDate))
    expect(result.current.hasNew).toBe(false)
  })

  it('sets hasNew to true when the server-provided latest date is newer than lastSeen', async () => {
    const lastSeen = '2026-03-01T00:00:00.000Z'
    const latest = '2026-03-25T00:00:00.000Z'
    localStorageMock.getItem.mockReturnValueOnce(lastSeen)

    const { result } = renderHook(() => useFeriadosNotification(latest, 'iron-gym'))

    await waitFor(() => expect(result.current.latestFeriadoDate).toBe(latest))
    expect(result.current.hasNew).toBe(true)
  })

  it('sets hasNew to false when no server date is provided', async () => {
    localStorageMock.getItem.mockReturnValueOnce(null)

    const { result } = renderHook(() => useFeriadosNotification(null, 'iron-gym'))

    await waitFor(() => expect(result.current.latestFeriadoDate).toBe(null))
    expect(result.current.hasNew).toBe(false)
  })

  it('does not write to localStorage when latestFeriadoDate is null', async () => {
    localStorageMock.getItem.mockReturnValueOnce(null)

    const { result } = renderHook(() => useFeriadosNotification(null, 'iron-gym'))

    await waitFor(() => expect(result.current.latestFeriadoDate).toBe(null))
    result.current.markAsSeen()

    expect(localStorageMock.setItem).toHaveBeenCalledTimes(0)
  })

  it('auto-saves the server-provided latest date as the first-visit baseline', async () => {
    const latest = '2026-03-25T00:00:00.000Z'
    localStorageMock.getItem.mockReturnValueOnce(null)

    const { result } = renderHook(() => useFeriadosNotification(latest, 'iron-gym'))

    await waitFor(() => expect(result.current.latestFeriadoDate).toBe(latest))

    expect(localStorageMock.setItem).toHaveBeenCalledWith('feriados_last_seen_at:iron-gym', latest)
    expect(result.current.hasNew).toBe(false)
  })

  it('keeps badge state isolated per tenant slug', async () => {
    const oldDate = '2026-03-01T00:00:00.000Z'
    const latest = '2026-03-25T00:00:00.000Z'
    localStorageMock.store = {
      'feriados_last_seen_at:iron-gym': latest,
      'feriados_last_seen_at:steel-club': oldDate,
    }

    const { result } = renderHook(() => useFeriadosNotification(latest, 'steel-club'))

    await waitFor(() => expect(result.current.latestFeriadoDate).toBe(latest))
    expect(localStorageMock.getItem).toHaveBeenCalledWith('feriados_last_seen_at:steel-club')
    expect(result.current.hasNew).toBe(true)
  })
})

describe('ISO String Comparison Logic', () => {
  it('correctly compares ISO strings - newer date is greater', () => {
    const newer = '2026-12-25T00:00:00.000Z'
    const older = '2026-01-01T00:00:00.000Z'
    expect(newer > older).toBe(true)
  })

  it('correctly compares ISO strings - same date is not greater', () => {
    const date1 = '2026-03-25T00:00:00.000Z'
    const date2 = '2026-03-25T00:00:00.000Z'
    expect(date1 > date2).toBe(false)
  })

  it('correctly compares ISO strings lexicographically', () => {
    const march = '2026-03-25T00:00:00.000Z'
    const april = '2026-04-01T00:00:00.000Z'
    expect(april > march).toBe(true)
  })
})
