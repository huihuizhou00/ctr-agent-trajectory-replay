#!/usr/bin/env python3
"""Run the independent process-verifier fixtures."""

import json
from pathlib import Path

from process_verifier import evaluate_process


ROOT = Path(__file__).resolve().parent
for path in sorted((ROOT / "fixtures").glob("*.json")):
    snapshot = json.loads(path.read_text())
    result = evaluate_process(snapshot)
    print(json.dumps({"fixture": path.name, **result}, sort_keys=True))

