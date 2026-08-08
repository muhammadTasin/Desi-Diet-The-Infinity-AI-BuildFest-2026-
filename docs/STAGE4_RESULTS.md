# Stage-4: PithaNet 27-class results

Stage-4 expands the Deshi Digest vision label space to 27 Bangladeshi food classes: 19 existing food classes and 8 PithaNet classes. The selected final adapter is the LoRA adapter exported from **checkpoint-645**.

## Final validation result

| Metric | Result |
| --- | ---: |
| Overall accuracy | 90.86% (905 / 996) |
| Macro accuracy | 89.09% |
| Existing 19-food accuracy | 90.42% (576 / 637) |
| PithaNet 8-class accuracy | 91.64% (329 / 359) |

The authoritative machine-readable reports are in [`results/`](../results): `FINAL_ACCURACY_REPORT.json`, `per_class_accuracy.csv`, `checkpoint_comparison.json`, and `confusion_summary.json`.

## Checkpoint selection

| Checkpoint | Existing foods | PithaNet | Overall | Macro |
| --- | ---: | ---: | ---: | ---: |
| checkpoint-500 | 89.95% | 91.64% | 90.56% | 88.89% |
| checkpoint-600 | 90.11% | 91.64% | 90.66% | 88.89% |
| **checkpoint-645** | **90.42%** | **91.64%** | **90.86%** | **89.09%** |

Checkpoint-645 is the winner because it has the best overall, macro, and existing-food accuracy among the evaluated checkpoints.

## Error summary

The sanitized confusion summary records the largest observed aggregate error pairs. The most frequent is `nakshi_pitha -> jamai_pitha` (8 images), followed by `morog_polao -> bangladeshi_biryani` (6 images). See [`results/confusion_summary.json`](../results/confusion_summary.json) for the complete sanitized list.

Results are for the 996-image held-out validation split used in Stage-4; they are not a guarantee of performance on other images or food presentations.
