import json, time
from pathlib import Path
from kafka import KafkaProducer
from backend.kafka.topics import KAFKA_BOOTSTRAP_SERVERS, NEWS_TOPIC

def main():
    path=Path(__file__).resolve().parents[1]/"data/mock/news.json"
    records=json.loads(path.read_text(encoding="utf-8"))
    producer=KafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v:json.dumps(v).encode("utf-8"))
    try:
        while True:
            for record in records:
                producer.send(NEWS_TOPIC, record); producer.flush()
                print("Published headline:",record["headline"]); time.sleep(1)
    except KeyboardInterrupt: pass
    finally: producer.close()
if __name__=="__main__": main()
