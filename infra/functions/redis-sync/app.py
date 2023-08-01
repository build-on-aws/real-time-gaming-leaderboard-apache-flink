import base64
import json
import os

import redis

r = redis.RedisCluster(host=os.environ["REDIS_HOST"], port=6379)


def lambda_handler(event, context):
    print('Incoming event: ', event)
    for record in event["Records"]:
        decoded_json = base64.decodestring(record["kinesis"]["data"])
        command = json.load(decoded_json)["command"]
        data = r.execute_command(command)
        print(data)
