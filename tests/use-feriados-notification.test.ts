/**
 * Unit tests for useFeriadosNotification hook
 * 
 * Tests the core logic:
 * - ISO string comparison
 * - localStorage read/write
 * - First visit auto-save
 * - Fail-safe behavior
 * - markAsSeen persistence
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFeriadosNotification } from '@/hooks/use-feriados-notification'

// Mock localStorage with proper typing
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

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useFeriadosNotification Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.store = {}
  })

  describe('5.1 - hasNew = false when latestFeriadoDate equals lastSeen (same date)', () => {
    it('should set hasNew to false when dates are identical', async () => {
      const sameDate = '2026-03-25T00:00:00.000Z'
      localStorageMock.getItem.mockReturnValueOnce(sameDate) // lastSeen
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ latestFeriadoDate: sameDate }),
      })

      const { result } = renderHook(() => useFeriadosNotification())

      await waitFor(() => expect(result.current.latestFeriadoDate).toBe(sameDate))

      expect(result.current.hasNew).toBe(false)
    })
  })

  describe('5.2 - hasNew = true when latestFeriadoDate > lastSeen (newer date)', () => {
    it('should set hasNew to true when latest is newer than lastSeen', async () => {
      const lastSeen = '2026-03-01T00:00:00.000Z'
      const latest = '2026-03-25T00:00:00.000Z'
      localStorageMock.getItem.mockReturnValueOnce(lastSeen)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ latestFeriadoDate: latest }),
      })

      const { result } = renderHook(() => useFeriadosNotification())

      await waitFor(() => expect(result.current.latestFeriadoDate).toBe(latest))

      expect(result.current.hasNew).toBe(true)
    })
  })

  describe('5.3 - hasNew = false on fetch error (fail-safe)', () => {
    it('should set hasNew to false when fetch fails', async () => {
      localStorageMock.getItem.mockReturnValueOnce(null)
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useFeriadosNotification())

      // Wait for the effect to complete (hasNew should become false)
      await waitFor(() => expect(result.current.hasNew).toBe(false))
    })

    it('should set hasNew to false when API returns non-OK status', async () => {
      localStorageMock.getItem.mockReturnValueOnce(null)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const { result } = renderHook(() => useFeriadosNotification())

      await waitFor(() => expect(result.current.hasNew).toBe(false))
    })
  })

  describe('5.4 - markAsSeen does NOT write to localStorage when latestFeriadoDate is null', () => {
    it('should not call localStorage.setItem when latestFeriadoDate is null', async () => {
      localStorageMock.getItem.mockReturnValueOnce(null)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ latestFeriadoDate: null }),
      })

      const { result } = renderHook(() => useFeriadosNotification())

      await waitFor(() => expect(result.current.latestFeriadoDate).toBe(null))

      result.current.markAsSeen()

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(0)
    })
  })

  describe('5.5 - First visit auto-saves baseline to localStorage', () => {
    it('should auto-save latestFeriadoDate to localStorage on first visit', async () => {
      const latest = '2026-03-25T00:00:00.000Z'
      localStorageMock.getItem.mockReturnValueOnce(null) // No lastSeen
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ latestFeriadoDate: latest }),
      })

      const { result } = renderHook(() => useFeriadosNotification())

      await waitFor(() => expect(result.current.latestFeriadoDate).toBe(latest))

      // Should have auto-saved the latest date as baseline
      expect(localStorageMock.setItem).toHaveBeenCalledWith('feriados_last_seen_at', latest)
      // But hasNew should be false (first visit never shows badge)
      expect(result.current.hasNew).toBe(false)
    })

    it('should NOT auto-save when latestFeriadoDate is null on first visit', async () => {
      localStorageMock.getItem.mockReturnValueOnce(null)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ latestFeriadoDate: null }),
      })

      const { result } = renderHook(() => useFeriadosNotification())

      await waitFor(() => expect(result.current.latestFeriadoDate).toBe(null))

      // Should NOT have called setItem since there's nothing to save
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(0)
      expect(result.current.hasNew).toBe(false)
    })
  })
})

describe('ISO String Comparison Logic', () => {
  it('should correctly compare ISO strings - newer date is greater', () => {
    const newer = '2026-12-25T00:00:00.000Z'
    const older = '2026-01-01T00:00:00.000Z'
    expect(newer > older).toBe(true)
  })

  it('should correctly compare ISO strings - same date is not greater', () => {
    const date1 = '2026-03-25T00:00:00.000Z'
    const date2 = '2026-03-25T00:00:00.000Z'
    expect(date1 > date2).toBe(false)
  })

  it('should correctly compare ISO strings - lexicographic works for dates', () => {
    // ISO strings sort correctly lexicographically for UTC timestamps
    const march = '2026-03-25T00:00:00.000Z'
    const april = '2026-04-01T00:00:00.000Z'
    expect(april > march).toBe(true)
  })
})
