#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
staging="$(mktemp)"
trap 'rm -f "$staging"' EXIT
count="$(python -c 'import json;print(len(json.load(open("qa/journeys.json"))["journeys"]))')"
echo "Executing $count Chromium journeys from Home"
python -u qa/run_journeys.py --worker 0 "$count" > "$staging"
python qa/merge_journeys.py "$staging"
