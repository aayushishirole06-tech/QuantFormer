"""Optional FinBERT adapter; local keyword fallback avoids model downloads by default."""
import os
from functools import lru_cache

POS = {"beat","growth","gain","rise","rises","strong","stronger","profit","upgrade","surge","bullish","positive"}
NEG = {"miss","fall","falls","drop","decline","pressure","risk","weak","weaker","loss","downgrade","volatile","volatility","bearish","negative"}

@lru_cache(maxsize=1)
def _pipeline():
    from transformers import pipeline
    return pipeline("text-classification", model="ProsusAI/finbert", tokenizer="ProsusAI/finbert")

def analyze_sentiment(text):
    if os.getenv("USE_FINBERT","0").lower() in {"1","true","yes"}:
        try:
            r=_pipeline()(text[:512])[0]
            return {"label":str(r["label"]).lower(),"confidence":round(float(r["score"]),4),"method":"ProsusAI/finbert"}
        except Exception as exc:
            result=_fallback(text); result["warning"]=f"FinBERT unavailable: {type(exc).__name__}"; return result
    return _fallback(text)

def _fallback(text):
    
    tokens = {t.strip(".,!?;:()[]{}").lower() for t in text.split()}

    score=len(tokens&POS)-len(tokens&NEG)
    label="positive" if score>0 else "negative" if score<0 else "neutral"
    return {"label":label,"confidence":round(0.5 if score==0 else min(.95,.55+.1*abs(score)),4),"method":"keyword fallback"}
