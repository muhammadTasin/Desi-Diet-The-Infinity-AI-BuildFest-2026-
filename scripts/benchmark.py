#!/usr/bin/env python3
"""Summarize label accuracy from local JSONL predictions without modifying results."""
from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--predictions", required=True, type=Path,
                        help="JSONL records containing expected_label and predicted_label")
    parser.add_argument("--output", type=Path, default=Path("benchmark_summary.json"))
    args = parser.parse_args()

    totals: Counter[str] = Counter()
    correct: Counter[str] = Counter()
    total = hits = 0
    with args.predictions.open(encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            record = json.loads(line)
            try:
                expected = record["expected_label"]
                predicted = record["predicted_label"]
            except KeyError as exc:
                raise SystemExit(f"line {line_number}: missing {exc.args[0]}") from exc
            totals[expected] += 1
            total += 1
            if expected == predicted:
                correct[expected] += 1
                hits += 1

    if not total:
        raise SystemExit("no prediction records found")
    per_class = {label: {"correct": correct[label], "total": totals[label],
                          "accuracy": correct[label] / totals[label] * 100}
                 for label in sorted(totals)}
    summary = {"total": total, "correct": hits, "accuracy": hits / total * 100,
               "macro_accuracy": sum(row["accuracy"] for row in per_class.values()) / len(per_class),
               "per_class": per_class}
    args.output.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
