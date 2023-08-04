#!/bin/bash
echo "[grafana]
name=grafana
baseurl=https://packages.grafana.com/oss/rpm
repo_gpgcheck=1
enabled=1
gpgcheck=1
gpgkey=https://packages.grafana.com/gpg.key
sslverify=1
sslcacert=/etc/pki/tls/certs/ca-bundle.crt" >/home/ec2-user/grafana.repo
sudo cp /home/ec2-user/grafana.repo /etc/yum.repos.d/grafana.repo
sudo yum install grafana jq -y
sudo systemctl daemon-reload
sudo systemctl start grafana-server
sudo systemctl status grafana-server
PASSWORD=$(aws secretsmanager get-secret-value --secret-id "$1" --region "$2" | jq -r .SecretString | jq -r .password)
sudo grafana-cli admin reset-admin-password "$PASSWORD"
sudo grafana-cli plugins install redis-datasource
sudo systemctl restart grafana-server
sudo systemctl status grafana-server