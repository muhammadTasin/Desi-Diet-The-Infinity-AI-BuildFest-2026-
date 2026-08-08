# Reproducing Stage-4 training

This release records the configuration of the completed Stage-4 run. It does not redistribute the underlying images or JSONL manifests. To reproduce a run, obtain the datasets under their respective terms, keep them outside this repository, and create local manifests with paths valid on your machine.

## Recorded configuration

- Base model: `Qwen/Qwen3-VL-2B-Instruct`
- Fine-tuning: LoRA / 4-bit NF4 QLoRA
- LoRA: rank 4, alpha 16, dropout 0.05
- Training: 1.5 epochs, learning rate `2e-5`, cosine schedule, 5% warmup
- Batch setup: per-device batch size 1, gradient accumulation 8
- Training hardware: 2 × NVIDIA Tesla T4

Exact settings are in [`metadata/training_config.json`](../metadata/training_config.json); recorded software versions are in [`metadata/environment.json`](../metadata/environment.json).

## Prepare an environment

Use Python 3.12.13, install a CUDA-compatible PyTorch build for your hardware, then install the pinned stack:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-inference.txt
```

The recorded run used `torch==2.10.0+cu128`.

## Local data contract and launcher

Create local train and validation manifests using the input schema expected by your compatible MS-Swift Qwen3-VL SFT setup. Do not commit them. The clean training population was 6,872 samples: 2,720 rehearsal samples and 4,152 unique PithaNet images. Validation contained 996 held-out images.

The launcher prints its command by default; pass `--run` only after review:

```bash
python scripts/train_stage4.py --train-manifest /secure/path/train.jsonl --val-manifest /secure/path/val.jsonl
python scripts/train_stage4.py --train-manifest /secure/path/train.jsonl --val-manifest /secure/path/val.jsonl --output-dir /secure/path/stage4-output --run
```

The published adapter comes from checkpoint-645. No intermediate checkpoint or optimizer state is released.
