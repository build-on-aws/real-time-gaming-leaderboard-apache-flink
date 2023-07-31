import os

import boto3
import urllib3

http = urllib3.PoolManager()
s3 = boto3.client("s3")


def lambda_handler(event, context):
    print(event)
    request_type = event['RequestType']
    if request_type == 'Create':
        return on_create(event)


def on_create(event):
    urls_file = open('urls.txt', 'r')
    urls = urls_file.readlines()
    jars = []
    for url in urls:
        response = http.request('GET', url)
        splits = url.split("/")
        jars.append(splits[-1])
        s3.put_object(Bucket=os.environ["JARS_BUCKET"], Key=splits[-1], Body=response.data)
    return {'PhysicalResourceId': os.environ["JARS_BUCKET"] + ":jars:" + str(len(urls)),
            'Data': {"jars": ",".join(jars)}}
