#!/usr/bin/env bash
# PreToolUse hook (Bash): before any `git push`, run the merchant console's
# tests and production build. Block the push (exit 2) if either fails.
#
# Input: the hook JSON on stdin ({ tool_input: { command }, cwd, ... }).
# Exit 0 = allow, exit 2 = block (stderr is shown to Claude).

set -u

# On Windows, hooks may not inherit Node on PATH; add the default install dir if present.
[ -d "/c/Program Files/nodejs" ] && export PATH="/c/Program Files/nodejs:$PATH"

input="$(cat)"

# Pull the command and cwd out of the JSON with node (jq is not installed).
read_field() {
  printf '%s' "$input" | node -e '
    let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
      try {
        const j = JSON.parse(s);
        const v = process.argv[1] === "command" ? (j.tool_input || {}).command : j.cwd;
        process.stdout.write(v || "");
      } catch { process.stdout.write(""); }
    });' "$1"
}

cmd="$(read_field command)"
cwd="$(read_field cwd)"

# Only act on git push. Matches `git push`, `git -C dir push`, and pushes
# chained after cd/&&/;/|. Anything else passes straight through.
if ! printf '%s' "$cmd" | grep -Eq '(^|[;&|(]|[[:space:]])git([[:space:]]+-C[[:space:]]+("[^"]*"|'"'"'[^'"'"']*'"'"'|[^[:space:]]+))?[[:space:]]+push([[:space:]]|$)'; then
  exit 0
fi

# Work out which directory the push runs in:
#   git -C <dir> push ...   -> <dir>
#   cd <dir> && git push    -> <dir>
#   otherwise               -> the session's cwd
unquote() { local v="$1"; v="${v#\"}"; v="${v%\"}"; v="${v#\'}"; v="${v%\'}"; printf '%s' "$v"; }
dir=""
c_arg="$(printf '%s' "$cmd" | sed -nE 's/.*git[[:space:]]+-C[[:space:]]+("[^"]*"|'"'"'[^'"'"']*'"'"'|[^[:space:]]+)[[:space:]]+push.*/\1/p')"
cd_arg="$(printf '%s' "$cmd" | sed -nE 's/^[[:space:]]*cd[[:space:]]+("[^"]*"|'"'"'[^'"'"']*'"'"'|[^[:space:]&;]+).*/\1/p')"
if [ -n "$c_arg" ]; then dir="$(unquote "$c_arg")"
elif [ -n "$cd_arg" ]; then dir="$(unquote "$cd_arg")"
else dir="$cwd"; fi
[ -z "$dir" ] && dir="$PWD"
# A relative -C/cd path is relative to the session cwd.
case "$dir" in /*|[A-Za-z]:*) ;; *) dir="$cwd/$dir" ;; esac

root="$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$root" ]; then
  echo "pre-push-check: '$dir' is not inside a git repository; letting the push through for git to handle." >&2
  exit 0
fi

# The app with the tests and build. Fall back to the repo root if it has its own package.json.
app="$root/build-battle/merchant-console"
[ -f "$app/package.json" ] || app="$root"
if [ ! -f "$app/package.json" ]; then
  echo "pre-push-check: no package.json in $root; nothing to test, allowing the push." >&2
  exit 0
fi

logdir="${TMPDIR:-${TEMP:-/tmp}}/pre-push-check"
mkdir -p "$logdir"
stamp="$(date +%Y%m%d-%H%M%S)"
test_log="$logdir/test-$stamp.log"
build_log="$logdir/build-$stamp.log"

cd "$app" || { echo "pre-push-check: cannot cd to $app" >&2; exit 2; }

failed=()
npm test >"$test_log" 2>&1 || failed+=("tests (npm test)|$test_log")
npm run build >"$build_log" 2>&1 || failed+=("build (npm run build)|$build_log")

if [ ${#failed[@]} -eq 0 ]; then
  summary="$(sed 's/\x1b\[[0-9;]*m//g' "$test_log" | grep -E 'Tests[[:space:]]+[0-9]+' | tail -1 | sed 's/^[[:space:]]*//')"
  echo "pre-push-check: tests and build passed in $app${summary:+ ($summary)}. Push allowed." >&2
  exit 0
fi

{
  echo "pre-push-check: push BLOCKED. Checks failed in $app:"
  for f in "${failed[@]}"; do
    name="${f%%|*}"; log="${f#*|}"
    # Show a Windows path (C:/...) so the log can be opened from any shell.
    command -v cygpath >/dev/null 2>&1 && log="$(cygpath -m "$log")"
    echo "  - $name failed. Full output: $log"
    echo "    See it with: cat \"$log\"   (last lines below)"
    sed 's/\x1b\[[0-9;]*m//g' "$log" | tail -n 15 | sed 's/^/      /'
  done
  echo "Fix the failure and push again. To rerun by hand: cd \"$app\" && npm test && npm run build"
} >&2
exit 2
