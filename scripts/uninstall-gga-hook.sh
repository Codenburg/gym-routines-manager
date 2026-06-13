#!/usr/bin/env bash
# uninstall-gga-hook.sh
# Remove the GGA pre-commit wrapper installed by install-gga-hook.sh.
#
# Behavior:
#   - If the current .git/hooks/pre-commit is NOT our wrapper (no
#     wrapper marker), exit non-zero with a clear message — refuse to
#     touch an unrelated hook.
#   - If .git/hooks/pre-commit.bak exists, restore it as the active hook
#     and remove the .bak (so the dev's original 6-line stub comes back).
#   - Else, remove the wrapper hook outright (this was a fresh install
#     with nothing to restore to).
#
# Usage: bash scripts/uninstall-gga-hook.sh

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOK_PATH="${REPO_ROOT}/.git/hooks/pre-commit"
BAK_PATH="${REPO_ROOT}/.git/hooks/pre-commit.bak"
WRAPPER_MARKER='gga-pre-commit.mjs'

if [[ ! -f "${HOOK_PATH}" ]]; then
  echo "[uninstall-gga-hook] no hook at ${HOOK_PATH}; nothing to do." >&2
  exit 0
fi

if ! grep -qF "${WRAPPER_MARKER}" "${HOOK_PATH}"; then
  echo "[uninstall-gga-hook] hook at ${HOOK_PATH} is not the GGA wrapper — refusing to touch it." >&2
  exit 1
fi

if [[ -f "${BAK_PATH}" ]]; then
  cp "${BAK_PATH}" "${HOOK_PATH}"
  chmod +x "${HOOK_PATH}"
  rm -f "${BAK_PATH}"
  echo "[uninstall-gga-hook] restored original hook from ${BAK_PATH}"
else
  rm -f "${HOOK_PATH}"
  echo "[uninstall-gga-hook] removed wrapper hook (no .bak to restore)"
fi
