import base64
import json
import os

import redis

r = redis.RedisCluster(host=os.environ["REDIS_HOST"], port=6379)


def lambda_handler(event, context):
    print('Incoming event: ', event)
    for record in event["Records"]:
        bytes = base64.decodebytes(str.encode(record["kinesis"]["data"]))
        command = json.loads(bytes)["command"]
        data = r.execute_command(*command.split(" "))
        print(data)
