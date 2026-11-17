#!/bin/sh
set -eu
# Trust only this disposable CA inside this container; never change the host trust store.
mkdir -p "$HOME/.pki/nssdb"
certutil -N --empty-password -d "sql:$HOME/.pki/nssdb"
certutil -A -d "sql:$HOME/.pki/nssdb" -n JiayouDisposableQA -t 'C,,' -i /qa-tls/ca.crt
export NODE_EXTRA_CA_CERTS=/qa-tls/ca.crt
export CHROME_PATH
CHROME_PATH=$(find /ms-playwright -path '*/chrome-linux*/chrome' -type f | head -n 1)
test -n "$CHROME_PATH"
case "${1:-}" in
  smoke) exec node tests/auth-cookie-smoke.mjs ;;
  api) shift; exec node tests/api-acceptance.mjs "$@" ;;
  *) echo 'Explicit QA command required' >&2; exit 1 ;;
esac
