/**
 * Unit tests for the wrapper's exported `filterFindings` helper.
 *
 * `filterFindings(findings, changedLines, ignoreSet, killSwitch)` is the
 * single function the test layer needs in order to validate the diff-only
 * behavior without spawning git or `gga`. The wrapper is tested end-to-end
 * via a manual smoke run; this suite covers the pure decision logic.
 *
 * Coverage (≥ 5 cases per T6 in openspec/changes/gga-hook-diff-only/tasks.md):
 *   1. Changed line + GGA finding → survives
 *   2. Unchanged line → suppressed
 *   6. Empty changed-line set → line-localized findings suppressed, file-level survive
 *   8. Non-conforming stdout → non-localizable findings preserved (GGA's verdict)
 *   9. KILL_SWITCH=true → no suppression (pass-through)
 */

import { describe, it, expect } from 'vitest'
import { filterFindings } from '../scripts/gga-pre-commit.mjs'
import { parseGgaIgnore } from '../scripts/gga-ignore-helper.mjs'

// Hand-rolled Findings (matches the shape produced by scripts/gga-output-parser.mjs).
const errorOn = (file, line, message = 'error: something off') => ({
  file,
  line,
  severity: 'error',
  message,
})

const fileLevel = (file, message = 'file-level note') => ({
  file,
  line: null,
  severity: 'info',
  message,
})

const nonLocalizable = (message = 'Unstructured prose line') => ({
  file: 'Unstructured',
  line: null,
  severity: 'info',
  message,
})

describe('filterFindings', () => {
  it('(case 1) keeps a finding whose line is in the changed-line set', () => {
    const findings = [errorOn('src/lib/x.ts', 42)]
    const changedLines = new Map([['src/lib/x.ts', new Set([42])]])
    const ignore = { entries: [], raw: '' }
    const result = filterFindings(findings, changedLines, ignore, false)
    expect(result).toEqual(findings)
  })

  it('(case 2) drops a finding whose line is NOT in the changed-line set', () => {
    const findings = [errorOn('src/lib/x.ts', 42), errorOn('src/lib/x.ts', 50)]
    const changedLines = new Map([['src/lib/x.ts', new Set([42])]])
    const ignore = { entries: [], raw: '' }
    const result = filterFindings(findings, changedLines, ignore, false)
    expect(result).toEqual([errorOn('src/lib/x.ts', 42)])
  })

  it('drops findings whose file is missing from the changed-line set entirely', () => {
    const findings = [errorOn('src/lib/unchanged.ts', 10), errorOn('src/lib/touched.ts', 1)]
    const changedLines = new Map([['src/lib/touched.ts', new Set([1])]])
    const ignore = { entries: [], raw: '' }
    const result = filterFindings(findings, changedLines, ignore, false)
    expect(result).toEqual([errorOn('src/lib/touched.ts', 1)])
  })

  it('(case 6) suppresses all line-localized findings when changed-line set is empty, but keeps file-level findings', () => {
    const findings = [
      errorOn('src/lib/x.ts', 1),
      errorOn('src/lib/x.ts', 2),
      fileLevel('src/lib/x.ts', 'file-level note'),
    ]
    const changedLines = new Map() // empty — `git commit --allow-empty` or no relevant edits
    const ignore = { entries: [], raw: '' }
    const result = filterFindings(findings, changedLines, ignore, false)
    expect(result).toEqual([fileLevel('src/lib/x.ts', 'file-level note')])
  })

  it('drops a finding ignored by a single-line .gga-ignore entry', () => {
    const findings = [errorOn('src/lib/x.ts', 42)]
    const changedLines = new Map([['src/lib/x.ts', new Set([42])]])
    const ignore = parseGgaIgnore('src/lib/x.ts:42')
    const result = filterFindings(findings, changedLines, ignore, false)
    expect(result).toEqual([])
  })

  it('drops all findings in a file ignored by a whole-file .gga-ignore entry', () => {
    const findings = [
      errorOn('src/lib/rutinas.ts', 1),
      errorOn('src/lib/rutinas.ts', 50),
      fileLevel('src/lib/rutinas.ts', 'file-level note'),
    ]
    const changedLines = new Map([['src/lib/rutinas.ts', new Set([1, 50])]])
    const ignore = parseGgaIgnore('src/lib/rutinas.ts')
    const result = filterFindings(findings, changedLines, ignore, false)
    expect(result).toEqual([])
  })

  it('drops findings matched by an inclusive .gga-ignore range', () => {
    const findings = [errorOn('src/lib/x.ts', 105), errorOn('src/lib/x.ts', 50)]
    const changedLines = new Map([['src/lib/x.ts', new Set([50, 105])]])
    const ignore = parseGgaIgnore('src/lib/x.ts:100-110')
    const result = filterFindings(findings, changedLines, ignore, false)
    expect(result).toEqual([errorOn('src/lib/x.ts', 50)])
  })

  it('(case 8) preserves non-localizable findings even when their synthetic file is not in the changed-line set', () => {
    const findings = [nonLocalizable('The codebase has some issues.')]
    const changedLines = new Map([['src/lib/x.ts', new Set([1])]])
    const ignore = { entries: [], raw: '' }
    const result = filterFindings(findings, changedLines, ignore, false)
    // Non-localizable findings carry GGA's verdict — they always survive the filter.
    expect(result).toEqual(findings)
  })

  it('(case 9) suppresses nothing when KILL_SWITCH is true — pass-through', () => {
    const findings = [
      errorOn('src/lib/unchanged.ts', 999),
      fileLevel('src/lib/x.ts', 'file-level note'),
    ]
    const changedLines = new Map() // empty
    const ignore = { entries: [], raw: '' }
    const result = filterFindings(findings, changedLines, ignore, true)
    expect(result).toEqual(findings)
  })

  it('preserves a finding whose changed-line set is missing for its file but is ignored-set matched', () => {
    // The change to a file has no GGA findings; an old finding from before
    // the change exists. The old finding is in knownFiles (from a previous
    // pass), but its line is not in the changed-line set. It should be
    // suppressed (not preserved as a non-localizable finding — the parser
    // already did that disambiguation).
    const findings = [errorOn('src/lib/x.ts', 1)]
    const changedLines = new Map()
    const ignore = { entries: [], raw: '' }
    const result = filterFindings(findings, changedLines, ignore, false)
    expect(result).toEqual([])
  })

  it('handles a realistic mixed corpus end-to-end', () => {
    const findings = [
      errorOn('src/lib/touched.ts', 10, 'error: changed line, changed'),     // survives (changed)
      errorOn('src/lib/touched.ts', 99, 'error: unchanged line'),            // suppressed
      errorOn('src/lib/untouched.ts', 1, 'error: file not in diff'),         // suppressed
      fileLevel('src/lib/other.ts', 'file-level on a touched file'),         // survives (line=null)
      nonLocalizable('Some unstructured summary from the AI.'),              // survives (non-localizable)
      errorOn('src/lib/ignored.ts', 5, 'error: matches ignore entry'),       // suppressed by ignore
    ]
    const changedLines = new Map([
      ['src/lib/touched.ts', new Set([10, 11, 12])],
      ['src/lib/other.ts', new Set([1, 2, 3])],
    ])
    const ignore = parseGgaIgnore('src/lib/ignored.ts:5')
    const result = filterFindings(findings, changedLines, ignore, false)
    expect(result).toEqual([
      errorOn('src/lib/touched.ts', 10, 'error: changed line, changed'),
      fileLevel('src/lib/other.ts', 'file-level on a touched file'),
      nonLocalizable('Some unstructured summary from the AI.'),
    ])
  })
})
