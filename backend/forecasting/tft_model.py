"""TFT builder scaffold. Requires torch and pytorch-forecasting."""
def build_tft_model(training_dataset, hidden_size=16, attention_head_size=2, dropout=0.1):
    from pytorch_forecasting import TemporalFusionTransformer
    from pytorch_forecasting.metrics import QuantileLoss
    return TemporalFusionTransformer.from_dataset(training_dataset, learning_rate=.03,
        hidden_size=hidden_size, attention_head_size=attention_head_size, dropout=dropout,
        hidden_continuous_size=8, loss=QuantileLoss(), log_interval=10,
        reduce_on_plateau_patience=4)
