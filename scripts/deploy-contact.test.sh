#!/usr/bin/env bash
# Checks the privacy-contact part of scripts/deploy.sh (the lines between "BEGIN contact" and "END contact"),
# including names with spaces, quotes and accents:   bash scripts/deploy-contact.test.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
snippet="$(sed -n '/^# BEGIN contact/,/^# END contact/p' "$here/deploy.sh")"
[ -n "$snippet" ] || { echo "contact block not found in deploy.sh" >&2; exit 1; }

run() { # name email -> prints the docker arguments the block adds, one per line
  DATA_ARGS=()
  PRIVACY_CONTACT_NAME_B64="${1:+$(printf '%s' "$1" | base64 -w0)}"
  PRIVACY_CONTACT_EMAIL_B64="${2:+$(printf '%s' "$2" | base64 -w0)}"
  export PRIVACY_CONTACT_NAME_B64 PRIVACY_CONTACT_EMAIL_B64
  eval "$snippet"
  printf '%s\n' "${DATA_ARGS[@]+"${DATA_ARGS[@]}"}"
}

expect() { [ "$1" = "$2" ] || { echo "FAIL: expected [$2] got [$1]" >&2; exit 1; }; }

expect "$(run 'Example Operator' 'privacy@example.test')" $'-e\nPRIVACY_CONTACT_NAME=Example Operator\n-e\nPRIVACY_CONTACT_EMAIL=privacy@example.test'
expect "$(run "Mahyuddin \"Bob\" O'Neil; \$(touch /nonexistent) é" 'a@b.test')" $'-e\nPRIVACY_CONTACT_NAME=Mahyuddin "Bob" O\'Neil; $(touch /nonexistent) é\n-e\nPRIVACY_CONTACT_EMAIL=a@b.test'
expect "$(run '' 'only@example.test')" $'-e\nPRIVACY_CONTACT_EMAIL=only@example.test'
expect "$(run '' '')" ''
expect "$(run $'two\nlines' 'x@y.test')" $'-e\nPRIVACY_CONTACT_NAME=twolines\n-e\nPRIVACY_CONTACT_EMAIL=x@y.test'
echo "deploy contact test OK"

# The Quran Foundation block (between "BEGIN quran-foundation" and "END quran-foundation"): both credentials go into an env
# file readable by the owner only, passed with --env-file; with one missing nothing is passed. Run in a subshell each time,
# because the block sets an EXIT trap that removes the file.
qf_snippet="$(sed -n '/^# BEGIN quran-foundation/,/^# END quran-foundation/p' "$here/deploy.sh")"
[ -n "$qf_snippet" ] || { echo "quran-foundation block not found in deploy.sh" >&2; exit 1; }
decode_b64() { [ -n "${1:-}" ] && printf '%s' "$1" | base64 -d 2>/dev/null | tr -d '\r\n' || true; }
qf() { # id secret -> the docker arguments, the file's mode and its contents
  (
    DATA_ARGS=()
    QF_CLIENT_ID_B64="${1:+$(printf '%s' "$1" | base64 -w0)}"
    QF_CLIENT_SECRET_B64="${2:+$(printf '%s' "$2" | base64 -w0)}"
    eval "$qf_snippet"
    if [ -n "$QF_ENV_FILE" ]; then
      [ "${DATA_ARGS[*]}" = "--env-file $QF_ENV_FILE" ] || { echo "FAIL: arguments [${DATA_ARGS[*]}]" >&2; exit 1; }
      stat -c %a "$QF_ENV_FILE"
      cat "$QF_ENV_FILE"
    else
      printf '%s' "${DATA_ARGS[*]-}"
    fi
  )
}
expect "$(qf 'client-1' 'se cr$et"x')" $'600\nQF_CLIENT_ID=client-1\nQF_CLIENT_SECRET=se cr$et"x'
expect "$(qf 'client-1' '')" ''
expect "$(qf '' 'secret')" ''
echo "deploy quran-foundation test OK"
