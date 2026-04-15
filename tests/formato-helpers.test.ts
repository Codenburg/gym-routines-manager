/**
 * Unit tests for Formato 4x12 helper functions
 * 
 * Tests:
 * - parseInitialFormat: parse "4x12" into {series, reps}
 * - combineToFormat: combine series/reps into "4x12" format
 */

import { describe, it, expect } from 'vitest'
import { parseInitialFormat, combineToFormat } from '@/lib/schemas'

describe('parseInitialFormat', () => {
  describe('Valid format strings', () => {
    it('should parse "4x12" correctly', () => {
      const result = parseInitialFormat('4x12')
      expect(result).toEqual({ series: '4', reps: '12' })
    })

    it('should parse "6x15" correctly', () => {
      const result = parseInitialFormat('6x15')
      expect(result).toEqual({ series: '6', reps: '15' })
    })

    it('should parse "1x1" correctly', () => {
      const result = parseInitialFormat('1x1')
      expect(result).toEqual({ series: '1', reps: '1' })
    })

    it('should parse "100x999" correctly (large values)', () => {
      const result = parseInitialFormat('100x999')
      expect(result).toEqual({ series: '100', reps: '999' })
    })
  })

  describe('Invalid/empty inputs', () => {
    it('should return empty strings for undefined', () => {
      const result = parseInitialFormat(undefined)
      expect(result).toEqual({ series: '', reps: '' })
    })

    it('should return empty strings for empty string', () => {
      const result = parseInitialFormat('')
      expect(result).toEqual({ series: '', reps: '' })
    })

    it('should return empty strings for malformed format (missing x)', () => {
      const result = parseInitialFormat('412')
      expect(result).toEqual({ series: '', reps: '' })
    })

    it('should return empty strings for malformed format (wrong separator)', () => {
      const result = parseInitialFormat('4-12')
      expect(result).toEqual({ series: '', reps: '' })
    })

    it('should return empty strings for missing second number', () => {
      const result = parseInitialFormat('4x')
      expect(result).toEqual({ series: '', reps: '' })
    })

    it('should return empty strings for missing first number', () => {
      const result = parseInitialFormat('x12')
      expect(result).toEqual({ series: '', reps: '' })
    })

    it('should return empty strings for non-numeric values', () => {
      const result = parseInitialFormat('axb')
      expect(result).toEqual({ series: '', reps: '' })
    })
  })
})

describe('combineToFormat', () => {
  describe('Valid number inputs', () => {
    it('should combine 4 and 12 into "4x12"', () => {
      const result = combineToFormat(4, 12)
      expect(result).toBe('4x12')
    })

    it('should combine 6 and 15 into "6x15"', () => {
      const result = combineToFormat(6, 15)
      expect(result).toBe('6x15')
    })

    it('should combine 1 and 1 into "1x1"', () => {
      const result = combineToFormat(1, 1)
      expect(result).toBe('1x1')
    })

    it('should combine 0 and 0 into "0x0"', () => {
      const result = combineToFormat(0, 0)
      expect(result).toBe('0x0')
    })
  })

  describe('String number inputs', () => {
    it('should combine "4" and "12" into "4x12"', () => {
      const result = combineToFormat('4', '12')
      expect(result).toBe('4x12')
    })

    it('should combine "6" and "15" into "6x15"', () => {
      const result = combineToFormat('6', '15')
      expect(result).toBe('6x15')
    })
  })

  describe('Empty/invalid inputs', () => {
    it('should default to "0x0" when series is empty', () => {
      const result = combineToFormat('', 12)
      expect(result).toBe('0x12')
    })

    it('should default to "0x0" when reps is empty', () => {
      const result = combineToFormat(4, '')
      expect(result).toBe('4x0')
    })

    it('should default to "0x0" when both are empty', () => {
      const result = combineToFormat('', '')
      expect(result).toBe('0x0')
    })

    it('should default to "0x0" when inputs are NaN', () => {
      const result = combineToFormat(NaN, NaN)
      expect(result).toBe('0x0')
    })
  })
})