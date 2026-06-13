#!/usr/bin/env bash
# install-gga-hook.sh
# Install the GGA pre-commit wrapper at .git/hooks/pre-commit.
#
# Behavior:
#   - If the existing hook already invokes gga-pre-commit.mjs, no-op.
#   - Otherwise, back the existing hook up to .git/hooks/pre-commit.bak
#     (only on first install — the .bak is the original hook, preserved).
#   - Write a new hook with the `====== GGA START/END ======` markers
#     preserved (compatible with future `gga install` migration).
#   - chmod +x the new hook.
#
# Idempotent: re-running detects the wrapper marker and prints a notice
# without touching the hook or the .bak.
#
# Usage: bash scripts/install-gga-hook.sh

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOK_PATH="${REPO_ROOT}/.git/hooks/pre-commit"
BAK_PATH="${REPO_ROOT}/.git/hooks/pre-commit.bak"
WRAPPER_SCRIPT="${REPO_ROOT}/scripts/gga-pre-commit.mjs"

# Marker line we use to detect a previous install. Matches both the
# legacy `gga run || exit 1` stub (kept for back-compat detection) and
# the new node-based wrapper.
WRAPPER_MARKER='gga-pre-commit.mjs'

if [[ -f "${HOOK_PATH}" ]] && grep -qF "${WRAPPER_MARKER}" "${HOOK_PATH}"; then
  echo "[install-gga-hook] hook already installed at ${HOOK_PATH} — no-op."
  exit 0
fi

# Back up the existing hook. We only do this once — the .bak preserves
# the original state from before any wrapper was installed.
if [[ -f "${HOOK_PATH}" ]]; then
  if [[ ! -f "${BAK_PATH}" ]]; then
    cp "${HOOK_PATH}" "${BAK_PATH}"
    echo "[install-gga-hook] backed up existing hook to ${BAK_PATH}"
  else
    echo "[install-gga-hook] existing hook backed up already at ${BAK_PATH}; leaving it alone"
  fi
fi

cat > "${HOOK_PATH}" <<EOF
#!/usr/bin/env bash

# ======== GGA START ========
# Gentleman Guardian Angel - Code Review (diff-only)
# Runs scripts/gga-pre-commit.mjs which post-filters findings to lines
# the author changed. Use GGA_DIFF_FILTER=off to restore pre-filter
# behavior. See scripts/gga-pre-commit.mjs and CONTRIBUTING.md.
node "\$(git rev-parse --show-toplevel)/scripts/gga-pre-commit.mjs" || exit 1
# ======== GGA END ========
EOF

chmod +x "${HOOK_PATH}"
echo "[install-gga-hook] installed wrapper hook at ${HOOK_PATH}"
echo "[install-gga-hook] wrapper calls: node ${WRAPPER_SCRIPT}"
