import datetime
import json
import os
import random
import time
import boto3

kinesis = boto3.client('kinesis')


def lambda_handler(event, context):
    records = []

    for j in range(1, 5):
        for i in range(1, 50):
            speed = random.randint(150, 350)
            distance = random.randint(1, 50)
            time_millis = datetime.datetime.now()
            if random.randint(0, 4) == 0:
                # Replay old data 25% of the time. 1 day to 7 day in the past.
                time_millis = time_millis - datetime.timedelta(days=random.randint(1, 7))

            data = json.dumps({
                "player_id": "player-{}".format(i),
                "speed_kmph": speed,
                "distance_meters": distance,
                "event_time": time_millis.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
            })
            records.append({'Data': data.encode('utf-8'), 'PartitionKey': str(i)})
            kinesis.put_records(Records=records, StreamName=os.environ["KINESIS_STREAM_NAME"])

            # Mimic real world retry and duplicate record ingestion 1 in 3 of the time (33% fail and retry)
            if random.randint(1, 3) == 1:
                time.sleep(2)
                kinesis.put_records(Records=records, StreamName=os.environ["KINESIS_STREAM_NAME"])
        time.sleep(5)
