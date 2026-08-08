# Stage-4 examples

Run inference with a local image after installing [`requirements-inference.txt`](../requirements-inference.txt):

```bash
python scripts/infer.py --image /path/to/food.jpg
```

The base model is fetched from Hugging Face unless `--model` points to a local copy. The model adapter in this repository is not a standalone base model.
