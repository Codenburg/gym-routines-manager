/**
 * Unit tests for Promocion Zod schemas
 * 
 * Tests per-action schemas for atomic updates:
 * - updatePromocionContentSchema: titulo/descripcion validation
 * - updatePromocionPrecioSchema: positive integer validation
 * - togglePromocionActivoSchema: boolean validation
 */

import { describe, it, expect } from 'vitest'
import {
  updatePromocionContentSchema,
  updatePromocionPrecioSchema,
  togglePromocionActivoSchema,
} from '@/lib/schemas'

describe('4.1 - updatePromocionContentSchema', () => {
  describe('Valid inputs', () => {
    it('should accept valid titulo and descripcion', () => {
      const result = updatePromocionContentSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        titulo: 'Promoción de Verano',
        descripcion: '2 meses bonificados',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.titulo).toBe('Promoción de Verano')
        expect(result.data.descripcion).toBe('2 meses bonificados')
      }
    })

    it('should accept titulo without descripcion (optional)', () => {
      const result = updatePromocionContentSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        titulo: 'Promoción de Invierno',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.titulo).toBe('Promoción de Invierno')
        expect(result.data.descripcion).toBeUndefined()
      }
    })
  })

  describe('Invalid inputs', () => {
    it('should reject empty titulo', () => {
      const result = updatePromocionContentSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        titulo: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El título es requerido')
      }
    })

    it('should reject missing titulo', () => {
      const result = updatePromocionContentSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        descripcion: 'Some description',
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty id', () => {
      const result = updatePromocionContentSchema.safeParse({
        id: '',
        titulo: 'Valid Title',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('ID requerido')
      }
    })
  })
})

describe('4.2 - updatePromocionPrecioSchema', () => {
  describe('Valid inputs', () => {
    it('should accept positive integer precio', () => {
      const result = updatePromocionPrecioSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        precio: 5000,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.precio).toBe(5000)
      }
    })

    it('should accept string that coerces to positive integer', () => {
      const result = updatePromocionPrecioSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        precio: '10000',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.precio).toBe(10000)
      }
    })

    it('should accept precio of 1 (minimum positive)', () => {
      const result = updatePromocionPrecioSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        precio: 1,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid inputs', () => {
    it('should reject negative precio', () => {
      const result = updatePromocionPrecioSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        precio: -10,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El precio debe ser un entero positivo')
      }
    })

    it('should reject zero precio', () => {
      const result = updatePromocionPrecioSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        precio: 0,
      })
      expect(result.success).toBe(false)
    })

    it('should reject decimal numbers', () => {
      const result = updatePromocionPrecioSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        precio: 99.50,
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty id', () => {
      const result = updatePromocionPrecioSchema.safeParse({
        id: '',
        precio: 5000,
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('4.3 - togglePromocionActivoSchema', () => {
  describe('Valid inputs', () => {
    it('should accept activo = true', () => {
      const result = togglePromocionActivoSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        activo: true,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.activo).toBe(true)
      }
    })

    it('should accept activo = false', () => {
      const result = togglePromocionActivoSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        activo: false,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.activo).toBe(false)
      }
    })

    it('should accept string "true" coerced to boolean', () => {
      const result = togglePromocionActivoSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        activo: 'true' as unknown as boolean,
      })
      // String should fail since z.boolean() doesn't coerce
      expect(result.success).toBe(false)
    })
  })

  describe('Invalid inputs', () => {
    it('should reject missing id', () => {
      const result = togglePromocionActivoSchema.safeParse({
        activo: true,
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty id', () => {
      const result = togglePromocionActivoSchema.safeParse({
        id: '',
        activo: true,
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('Schema isolation - each schema only accepts its specific fields', () => {
  it('updatePromocionContentSchema should not accept precio field', () => {
    const result = updatePromocionContentSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      titulo: 'Test',
      precio: 5000, // Should be ignored or cause error
    })
    // precio should not be in the parsed data (extra fields are stripped by zod by default)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.precio).toBeUndefined()
    }
  })

  it('updatePromocionPrecioSchema should not accept titulo field', () => {
    const result = updatePromocionPrecioSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      precio: 5000,
      titulo: 'Test', // Extra field
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.titulo).toBeUndefined()
    }
  })

  it('togglePromocionActivoSchema should only accept id and activo', () => {
    const result = togglePromocionActivoSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      activo: true,
      titulo: 'Test', // Extra field
      precio: 5000, // Extra field
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.titulo).toBeUndefined()
      expect(result.data.precio).toBeUndefined()
    }
  })
})
