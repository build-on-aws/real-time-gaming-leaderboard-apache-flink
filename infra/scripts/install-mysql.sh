#!/bin/bash
sudo yum install -y docker jq
sudo service docker start
export PASSWORD=$(aws secretsmanager get-secret-value --secret-id "$1" --region "$2" | jq -r .SecretString | jq -r .password)
sudo mkdir -p /home/ec2-user/init
sudo chmod -R 777 /home/ec2-user/init
echo "GRANT SELECT, RELOAD, SHOW DATABASES, REPLICATION SLAVE, REPLICATION CLIENT ON *.* to admin@'%';" >> /home/ec2-user/init/grants.sql
sudo docker run -d -p 3306:3306 --name db -e MYSQL_USER=admin -e MYSQL_DATABASE=gaming -e MYSQL_PASSWORD="$PASSWORD" -e MYSQL_ROOT_PASSWORD="$PASSWORD" -v /home/ec2-user/init:/docker-entrypoint-initdb.d: mysql:8