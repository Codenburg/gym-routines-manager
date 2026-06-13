/**
 * Unit tests for the .gga-ignore parser used by the GGA pre-commit wrapper.
 *
 * The parser is pure (no I/O), so we exercise it with hand-crafted strings
 * and assert on the resulting IgnoreSet / boolean.
 *
 * Coverage (≥ 5 cases per T3 in openspec/changes/gga-hook-diff-only/tasks.md):
 *   1. Empty input → empty IgnoreSet
 *   2. Comment-only / blank input → empty IgnoreSet
 *   3. Single-line entry → isIgnored matches that line only
 *   4. Whole-file pattern → isIgnored matches every line in that file
 *   5. Inclusive range → isIgnored matches lines inside the range
 *   6. Malformed range "N-" → throws with the offending line number
 *   7. Inverted range "M-N" where M > N → throws
 *   8. Glob with `*` (single segment) and `**` (any path) both match correctly
 */

import { describe, it, expect } from 'vitest'
import { parseGgaIgnore, isIgnored } from '../scripts/gga-ignore-helper.mjs'

describe('parseGgaIgnore', () => {
  it('returns an empty IgnoreSet for empty input', () => {
    const result = parseGgaIgnore('')
    expect(result.entries).toEqual([])
    expect(result.raw).toBe('')
  })

  it('ignores comment lines and blank lines', () => {
    const text = [
      '# header comment',
      '',
      '   ',
      '# another comment',
    ].join('\n')
    const result = parseGgaIgnore(text)
    expect(result.entries).toEqual([])
  })

  it('parses a single-line entry with its line number', () => {
    const text = 'src/app/actions/feriados.ts:150'
    const result = parseGgaIgnore(text)
    expect(result.entries).toEqual([
      { fileGlob: 'src/app/actions/feriados.ts', line: 150, range: null },
    ])
  })

  it('parses a whole-file entry (no colon)', () => {
    const text = 'src/lib/rutinas.ts'
    const result = parseGgaIgnore(text)
    expect(result.entries).toEqual([
      { fileGlob: 'src/lib/rutinas.ts', line: null, range: null },
    ])
  })

  it('parses an inclusive line range', () => {
    const text = 'src/app/actions/descuentos-duracion.ts:100-105'
    const result = parseGgaIgnore(text)
    expect(result.entries).toEqual([
      { fileGlob: 'src/app/actions/descuentos-duracion.ts', line: null, range: [100, 105] },
    ])
  })

  it('parses mixed entries preserving order', () => {
    const text = [
      '# mixed seed',
      'src/app/actions/promociones.ts:105',
      'src/lib/rutinas.ts:10-20',
      'tests/check-*.ts',
    ].join('\n')
    const result = parseGgaIgnore(text)
    expect(result.entries).toEqual([
      { fileGlob: 'src/app/actions/promociones.ts', line: 105, range: null },
      { fileGlob: 'src/lib/rutinas.ts', line: null, range: [10, 20] },
      { fileGlob: 'tests/check-*.ts', line: null, range: null },
    ])
  })

  it('throws on a malformed range with the 1-indexed line number', () => {
    const text = [
      'src/app/actions/feriados.ts:150', // line 1 — valid
      'src/app/actions/feriados.ts:42-', // line 2 — malformed
    ].join('\n')
    expect(() => parseGgaIgnore(text)).toThrowError(/\.gga-ignore:2:.*malformed range.*'42-'/)
  })

  it('throws on an inverted range', () => {
    const text = 'src/lib/x.ts:50-30'
    expect(() => parseGgaIgnore(text)).toThrowError(/inverted range/)
  })

  it('throws on a missing line number after the colon', () => {
    const text = 'src/lib/x.ts:'
    expect(() => parseGgaIgnore(text)).toThrowError(/missing line number/)
  })

  it('throws on a non-numeric line number', () => {
    const text = 'src/lib/x.ts:abc'
    expect(() => parseGgaIgnore(text)).toThrowError(/invalid line number 'abc'/)
  })

  it('rejects unsupported glob characters', () => {
    const text = 'src/[abc]/x.ts'
    expect(() => parseGgaIgnore(text)).toThrowError(/unsupported glob char/)
  })
})

describe('isIgnored', () => {
  it('matches a single-line entry only for that exact line', () => {
    const set = parseGgaIgnore('src/app/actions/feriados.ts:150')
    expect(isIgnored(set, 'src/app/actions/feriados.ts', 150)).toBe(true)
    expect(isIgnored(set, 'src/app/actions/feriados.ts', 149)).toBe(false)
    expect(isIgnored(set, 'src/app/actions/feriados.ts', 151)).toBe(false)
    expect(isIgnored(set, 'src/app/actions/other.ts', 150)).toBe(false)
  })

  it('matches a whole-file pattern for every line in that file', () => {
    const set = parseGgaIgnore('src/lib/rutinas.ts')
    expect(isIgnored(set, 'src/lib/rutinas.ts', 1)).toBe(true)
    expect(isIgnored(set, 'src/lib/rutinas.ts', 999)).toBe(true)
    // Other files unaffected.
    expect(isIgnored(set, 'src/lib/other.ts', 1)).toBe(false)
  })

  it('matches a range inclusively at both ends', () => {
    const set = parseGgaIgnore('src/app/actions/descuentos-duracion.ts:100-105')
    expect(isIgnored(set, 'src/app/actions/descuentos-duracion.ts', 99)).toBe(false)
    expect(isIgnored(set, 'src/app/actions/descuentos-duracion.ts', 100)).toBe(true)
    expect(isIgnored(set, 'src/app/actions/descuentos-duracion.ts', 103)).toBe(true)
    expect(isIgnored(set, 'src/app/actions/descuentos-duracion.ts', 105)).toBe(true)
    expect(isIgnored(set, 'src/app/actions/descuentos-duracion.ts', 106)).toBe(false)
  })

  it('matches a single-segment glob with *', () => {
    const set = parseGgaIgnore('tests/check-*.ts')
    expect(isIgnored(set, 'tests/check-admin.ts', 1)).toBe(true)
    expect(isIgnored(set, 'tests/check-rutina-types.ts', 1)).toBe(true)
    // * does not cross '/'
    expect(isIgnored(set, 'tests/sub/check-x.ts', 1)).toBe(false)
    expect(isIgnored(set, 'tests/other.ts', 1)).toBe(false)
  })

  it('matches a recursive glob with **', () => {
    const set = parseGgaIgnore('src/**/*.ts')
    expect(isIgnored(set, 'src/lib/x.ts', 1)).toBe(true)
    expect(isIgnored(set, 'src/app/actions/inner/y.ts', 1)).toBe(true)
    expect(isIgnored(set, 'lib/x.ts', 1)).toBe(false)
  })

  it('does not match a line-scoped entry when called with line = -1 (file-level finding)', () => {
    const set = parseGgaIgnore('src/lib/x.ts:42')
    // File-level findings (line=null) should not be silently suppressed by a
    // line-scoped ignore — only whole-file ignores apply to them.
    expect(isIgnored(set, 'src/lib/x.ts', -1)).toBe(false)
  })

  it('handles a realistic mix of entries in priority order', () => {
    const text = [
      '# comment',
      'src/app/actions/promociones.ts:105',
      'src/lib/rutinas.ts:10-20',
      'tests/check-*.ts',
    ].join('\n')
    const set = parseGgaIgnore(text)
    expect(isIgnored(set, 'src/app/actions/promociones.ts', 105)).toBe(true)
    expect(isIgnored(set, 'src/lib/rutinas.ts', 15)).toBe(true)
    expect(isIgnored(set, 'tests/check-db.ts', 1)).toBe(true)
    expect(isIgnored(set, 'src/app/actions/feriados.ts', 150)).toBe(false)
  })
})
