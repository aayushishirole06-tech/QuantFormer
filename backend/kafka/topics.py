import os
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
ORDER_BOOK_TOPIC = "quantformer.orderbook"
NEWS_TOPIC = "quantformer.news"
