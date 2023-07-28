#!/bin/bash
sudo yum install -y docker jq
sudo service docker start
export PASSWORD=$(aws secretsmanager get-secret-value --secret-id "$1" --region "$2" | jq -r .SecretString | jq -r .password)
sudo docker run -d -p 3306:3306 -e MYSQL_USER=admin -e MYSQL_DATABASE=gaming -e MYSQL_PASSWORD="$PASSWORD" -e MYSQL_ROOT_PASSWORD="$PASSWORD" mysql:8
