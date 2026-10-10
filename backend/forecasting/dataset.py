import pandas as pd

def build_feature_frame(orderbook_records, news_records=None):
    rows=[]
    for b in orderbook_records:
        bids,asks=b["bids"],b["asks"]
        bd=sum(float(x["volume"]) for x in bids); ad=sum(float(x["volume"]) for x in asks)
        bid,ask=float(bids[0]["price"]),float(asks[0]["price"])
        rows.append({"timestamp":pd.to_datetime(b["timestamp"],utc=True),"symbol":b["symbol"],
                     "mid_price":(bid+ask)/2,"spread":ask-bid,
                     "order_book_imbalance":(bd-ad)/max(bd+ad,1)})
    frame=pd.DataFrame(rows)
    if not frame.empty:
        frame["time_idx"]=range(len(frame)); frame["target"]=frame["mid_price"].shift(-1)
    return frame
