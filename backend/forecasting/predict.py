from pathlib import Path
def load_checkpoint(checkpoint_path):
    path=Path(checkpoint_path)
    if not path.exists(): raise FileNotFoundError(f"TFT checkpoint not found: {path}")
    from pytorch_forecasting import TemporalFusionTransformer
    return TemporalFusionTransformer.load_from_checkpoint(str(path))
