#!/usr/bin/env node
// gga-pre-commit.mjs
// Wrapper that runs `gga run` synchronously and post-filters the AI's
// findings to keep only those on lines the author changed. GGA v2.8.1's
// `--diff-only` flag is locked to `--pr-mode` (see ~/.local/share/gga/lib/
// pr_mode.sh:168-169), so pre-commit always reviews the whole staged file.
// The diff-only behavior is implemented here instead.
//
// Design overview:
//   1. Read .gga-ignore                                       (optional)
//   2. git diff --cached --unified=0  →  changed-line set      (Map<file, Set<line>>)
//   3. git diff --cached --name-only  →  staged files          (Set<string>)
//   4. If staged set is empty (empty commit) → exit 0 silently
//   5. spawnSync('gga', ['run'])                               ({ stdout, stderr, status })
//   6. If gga exited 0 → exit 0 (fast path — wrapper is a no-op on PASSED)
//   7. parseGgaOutput(stdout, stagedFiles)                     (Finding[])
//   8. filterFindings(findings, changedLines, ignore, killSwitch)
//   9. Print surviving findings, then a summary line
//  10. Exit 1 if any survived, else 0
//
// Edge-case policy lives in scripts/gga-output-parser.mjs and the
// .gga-ignore helper. Fail-OPEN on parse/runtime error — surfacing raw
// GGA output to stderr — so a misfiring AI gate can't train the team to
// bypass it with --no-verify.

import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { parseGgaIgnore, isIgnored } from './gga-ignore-helper.mjs'
import { parseGgaOutput } from './gga-output-parser.mjs'

const REPO = process.cwd()
const KILL_SWITCH = process.env.GGA_DIFF_FILTER === 'off'
const IGNORE_PATH = join(REPO, '.gga-ignore')
const MAX_BUFFER = 10 * 1024 * 1024

/**
 * Walk `git diff --cached --unified=0` output and produce the set of
 * (file, line) pairs the author added in the staged file. The line
 * numbers are 1-indexed and refer to the post-image.
 *
 * @param {string} diffText
 * @returns {Map<string, Set<number>>}
 */
export function parseDiffForLines(diffText) {
  const result = new Map()
  if (!diffText) return result

  const lines = diffText.split('\n')
  let currentFile = null
  let currentNewLine = 0
  let inHunk = false

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      const m = line.match(/^diff --git a\/.+ b\/(.+)$/)
      currentFile = m ? m[1] : null
      inHunk = false
      continue
    }
    if (line.startsWith('+++ ')) {
      // '+++ /dev/null' marks a deletion — no new lines, drop the file.
      if (line === '+++ /dev/null') {
        currentFile = null
        inHunk = false
        continue
      }
      const m = line.match(/^\+\+\+ b\/(.+)$/)
      currentFile = m ? m[1].trim() : null
      inHunk = false
      continue
    }
    if (line.startsWith('--- ')) {
      // '--- a/path' is the old-side reference; ignore but don't reset.
      continue
    }
    if (line.startsWith('@@')) {
      const m = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/)
      if (m) {
        currentNewLine = Number(m[1])
        inHunk = true
      } else {
        inHunk = false
      }
      continue
    }
    if (!inHunk || !currentFile || line.length === 0) continue

    const prefix = line[0]
    if (prefix === '+') {
      addToSet(result, currentFile, currentNewLine)
      currentNewLine++
    } else if (prefix === '-') {
      // Removed line — not in the staged file; GGA can't flag it.
    } else if (prefix === ' ') {
      currentNewLine++
    } else if (prefix === '\\') {
      // "\ No newline at end of file" — ignore.
    }
  }
  return result
}

/**
 * @param {Map<string, Set<number>>} map
 * @param {string} file
 * @param {number} line
 */
function addToSet(map, file, line) {
  let set = map.get(file)
  if (!set) {
    set = new Set()
    map.set(file, set)
  }
  set.add(line)
}

/**
 * The pure decision logic — exported for unit testing in
 * tests/gga-diff-filter.test.ts. The wrapper's main() wires it up to
 * the subprocess layer; the tests exercise it directly.
 *
 * @param {Array<{file:string,line:number|null,severity:string,message:string,rule?:string}>} findings
 * @param {Map<string, Set<number>>} changedLines
 * @param {{entries: Array<{fileGlob:string,line:number|null,range:[number,number]|null}>, raw: string}} ignoreSet
 * @param {boolean} killSwitch — when true, pass-through (no suppression)
 * @returns {Array<{file:string,line:number|null,severity:string,message:string,rule?:string}>}
 */
export function filterFindings(findings, changedLines, ignoreSet, killSwitch) {
  return findings.filter((f) => {
    if (killSwitch) return true
    // The .gga-ignore check runs first so a whole-file entry suppresses
    // every finding in that file (line-localized AND file-level). A
    // line-scoped entry (e.g. `path:42`) only matches line-localized
    // findings — `isIgnored` returns false for line=null against a
    // line-scoped entry, which is what we want.
    if (isIgnored(ignoreSet, f.file, f.line ?? -1)) return false
    // File-level (line=null) and non-localizable findings carry GGA's
    // verdict — they survive the diff-only filter.
    if (f.line === null) return true
    // Line-localized finding: must be on a changed line.
    const linesForFile = changedLines.get(f.file)
    if (!linesForFile || !linesForFile.has(f.line)) return false
    return true
  })
}

async function main() {
  // 1. Read .gga-ignore. Syntax errors FAIL CLOSED per the design — better
  // to block the commit than to silently skip a typo in the ignore file.
  let ignore = { entries: [], raw: '' }
  if (existsSync(IGNORE_PATH)) {
    const raw = readFileSync(IGNORE_PATH, 'utf8')
    ignore = parseGgaIgnore(raw) // throws on bad syntax — see #fail-closed below
  }

  // 2. Changed-line set from git diff.
  const diffOut = spawnSync('git', ['diff', '--cached', '--unified=0', '--no-color'], {
    encoding: 'utf8',
    maxBuffer: MAX_BUFFER,
  })
  if (diffOut.error) {
    process.stderr.write(`[gga-pre-commit] WARN: git diff failed (${diffOut.error.message}); skipping\n`)
    process.exit(0)
  }
  const changedLines = parseDiffForLines(diffOut.stdout)

  // 3. Staged files (path-only). Use --diff-filter=ACMRT to exclude
  // deletions (D) and modifications to type (T) — T can include binary
  // mode-only flips we don't want to feed the AI.
  const nameOut = spawnSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=ACMRT'],
    { encoding: 'utf8', maxBuffer: MAX_BUFFER },
  )
  if (nameOut.error) {
    process.stderr.write(`[gga-pre-commit] WARN: git name-only failed (${nameOut.error.message}); skipping\n`)
    process.exit(0)
  }
  const stagedFiles = new Set(
    nameOut.stdout
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean),
  )

  if (stagedFiles.size === 0) {
    // Empty commit (`git commit --allow-empty`) or no relevant changes.
    process.exit(0)
  }

  // 4. Run GGA.
  const gga = spawnSync('gga', ['run'], { encoding: 'utf8', maxBuffer: MAX_BUFFER })
  if (gga.error) {
    // Runtime failure (gga not installed, network, etc.) — fail OPEN.
    process.stderr.write(`[gga-pre-commit] WARN: gga run failed to spawn (${gga.error.message}); skipping\n`)
    process.exit(0)
  }
  if (gga.status === 0) {
    // PASSED — wrapper is a no-op on the happy path.
    process.exit(0)
  }

  // 5. Parse stdout.
  let findings
  try {
    findings = parseGgaOutput(gga.stdout || '', stagedFiles)
  } catch (err) {
    // Fail OPEN: surface the raw GGA output so the dev sees what was flagged.
    process.stderr.write(`[gga-pre-commit] WARN: failed to parse GGA output (${err.message})\n`)
    if (gga.stdout) process.stderr.write(gga.stdout)
    if (KILL_SWITCH) {
      // Kill switch overrides fail-OPEN: respect the user's "show me
      // everything" intent.
      process.exit(gga.status ?? 1)
    }
    process.exit(0)
  }

  // 6. Filter.
  const surviving = filterFindings(findings, changedLines, ignore, KILL_SWITCH)
  const suppressed = findings.length - surviving.length

  // 7. Report.
  if (surviving.length > 0) {
    process.stderr.write('\n[gga-pre-commit] GGA findings on changed lines:\n')
    for (const f of surviving) {
      const where = f.line !== null ? `${f.file}:${f.line}` : f.file
      process.stderr.write(
        `  ${f.severity.toUpperCase()}: ${where} ${f.message}${f.rule ? ` (${f.rule})` : ''}\n`,
      )
    }
  }
  process.stderr.write(
    `\n[gga-pre-commit] ${surviving.length} finding(s) on changed lines; ${suppressed} suppressed (unchanged or ignored)\n`,
  )

  if (KILL_SWITCH) {
    // Pass-through mode preserves GGA's exit code even if we didn't drop anything.
    process.exit(gga.status ?? 1)
  }
  process.exit(surviving.length > 0 ? 1 : 0)
}

// Only run main() when this file is the entry point. Importing the module
// from a test (e.g. tests/gga-diff-filter.test.ts) must not trigger git/
// gga subprocesses or process.exit().
const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('gga-pre-commit.mjs')
if (isMain) {
  main().catch((err) => {
    process.stderr.write(`[gga-pre-commit] FATAL: ${err?.message || err}\n`)
    process.exit(2)
  })
}
