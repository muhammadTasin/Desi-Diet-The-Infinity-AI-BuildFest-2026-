#!/usr/bin/env python3
"""Run deterministic single-image inference with the Stage-4 Qwen3-VL adapter."""
from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = "Qwen/Qwen3-VL-2B-Instruct"
DEFAULT_ADAPTER = ROOT / "models" / "stage4_27class"
PROMPT = "Identify the Bangladeshi food in this image. Reply with exactly one class label."


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True, type=Path, help="Local food image")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Base model ID or local path")
    parser.add_argument("--adapter", type=Path, default=DEFAULT_ADAPTER)
    parser.add_argument("--prompt", default=PROMPT)
    parser.add_argument("--run", action="store_true", help="Execute rather than print the command")
    args = parser.parse_args()

    if not args.image.is_file():
        parser.error(f"image not found: {args.image}")
    if not args.adapter.is_dir():
        parser.error(f"adapter directory not found: {args.adapter}")

    command = [
        "swift", "infer", "--model", str(args.model), "--adapters", str(args.adapter),
        "--model_type", "qwen3_vl", "--template", "qwen3_vl", "--attn_impl", "sdpa",
        "--max_batch_size", "1", "--temperature", "0", "--images", str(args.image),
        "--query", args.prompt,
    ]
    print(" ".join(command))
    if args.run:
        subprocess.run(command, check=True)


if __name__ == "__main__":
    main()
