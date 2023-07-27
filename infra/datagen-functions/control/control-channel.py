import datetime
import json
import os

import boto3

kinesis = boto3.client('kinesis')


def lambda_handler(event, context):
    records = []
    event["event_time"] = datetime.datetime.now().isoformat(timespec="milliseconds").replace('T', ' ')
    data = json.dumps(event)
    records.append({'Data': data.encode('utf-8'), 'PartitionKey': "CONTROL_CHANNEL"})

    kinesis.put_records(Records=records, StreamName=os.environ["KINESIS_STREAM_NAME"])
