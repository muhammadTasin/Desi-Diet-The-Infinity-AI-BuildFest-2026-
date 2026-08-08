# Deshi Digest Stage-4 Vision Model

## Base model

Qwen3-VL-2B-Instruct

## Fine-tuning

- LoRA
- 4-bit NF4 QLoRA
- Rank: 4
- Alpha: 16
- Dropout: 0.05
- 2x NVIDIA Tesla T4

## Classes

27 Bangladeshi food classes:

- 19 existing Deshi Digest food classes
- 8 PithaNet classes

## Training data

- 2,720 previous-food rehearsal samples
- 4,152 unique PithaNet training images
- 6,872 total training samples

## Validation

996 held-out images.

## Best checkpoint

checkpoint-645

## Final results

- Old 19-food accuracy: 90.42%
- PithaNet 8-class accuracy: 91.64%
- Overall 27-class accuracy: 90.86%
- Macro accuracy: 89.09%

## Important

This repository does not redistribute the raw PithaNet images.

The adapter requires the Qwen3-VL-2B-Instruct base model.
