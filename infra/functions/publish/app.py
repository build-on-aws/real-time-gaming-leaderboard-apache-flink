import time
import json
import boto3

kinesis = boto3.client("kinesis")


def lambda_handler(event, context):
    print('Incoming event: ', event)
    data = event["data"]
    data["event_time"] = time.time_ns() // 1_000_000
    response = kinesis.put_record(
        StreamName=event["stream"],
        Data=json.dumps(data).encode(),
        PartitionKey=str(time.time_ns())
    )
    print('Response: ', response)
