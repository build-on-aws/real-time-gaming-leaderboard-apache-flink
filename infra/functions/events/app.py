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
        for i in range(1, 25):
            speed = random.randint(150, 350)
            distance = random.randint(1, 50)
            data = json.dumps({
                "player_id": "player-{}".format(i),
                "speed_kmph": speed,
                "distance_meters": distance,
                "event_time": datetime.datetime.now().isoformat(timespec="milliseconds").replace('T', ' ')
            })
            records.append({'Data': data.encode('utf-8'), 'PartitionKey': str(i)})
            kinesis.put_records(Records=records, StreamName=os.environ["KINESIS_STREAM_NAME"])

            # Mimic real world retry and duplicate record ingestion 1 in 3 of the time
            if random.randint(1, 3) == 1:
                kinesis.put_records(Records=records, StreamName=os.environ["KINESIS_STREAM_NAME"])
            time.sleep(5)
