#!/usr/bin/env bash
# Runs both workspace test suites; invoke manually or wire into a hook in settings.json.
set -u

echo "== frontend (vitest) =="
npm run test:fe
fe=$?

echo "== backend (jest) =="
npm run test:be
be=$?

if [ $fe -ne 0 ] || [ $be -ne 0 ]; then
  echo "tests failed (frontend=$fe backend=$be)"
  exit 1
fi

echo "all tests passed"
