from __future__ import print_function

import json
import logging
import os
import random
import sys

import boto3

import pymysql

secret_arn = os.environ["SECRET_ARN"]
host = os.environ["DATABASE_HOST"]

secret = boto3.client("secretsmanager")

logger = logging.getLogger()
logger.setLevel(logging.INFO)

prefix = ["funny", "hot", "cool", "awesome", "moving", "speedy", "fast", "running", "winning"]
names = ["john", "devil", "tarzan", "car", "racer", "buddy", "superman", "rock", "star"]
countries = ['US', 'UK', 'DE', 'BE', 'FR', 'IN']
subscription_types = ['Free', '7d-Trial', 'Silver', 'Gold', 'Diamond']


def lambda_handler(event, context):
    try:
        parameters = json.loads(secret.get_secret_value(SecretId=secret_arn)["SecretString"])
        conn = pymysql.connect(host=host, user=parameters["username"], password=parameters["password"],
                               database=parameters["dbname"], cursorclass=pymysql.cursors.DictCursor)
    except pymysql.MySQLError as e:
        logger.error("ERROR: Unexpected error: Could not connect to MySQL instance.")
        logger.error(e)
        sys.exit()

    """
    This function creates a new table and writes records to it
    """
    db_read_index = 0
    with conn.cursor() as c1:
        c1.execute(
            "create table if not exists players ( player_id  varchar(50), alias varchar(50) NOT NULL, level INT, country varchar(2), is_bot tinyint, subscription_type varchar(20), PRIMARY KEY (player_id))")
        c1.execute(
            "create table if not exists tracker ( id INT, records INT,  PRIMARY KEY (id))")
        conn.commit()
        c1.execute("select * from tracker where id = 1")
        for row in c1:
            logger.info(row)
            db_read_index = row["records"]

    last_count = db_read_index
    with conn.cursor() as c2:
        for i in range(1, 25):
            player_id = "player-{}".format(db_read_index + i)
            alias = "{}-{}-{}".format(prefix[random.randint(0, len(prefix) - 1)],
                                      names[random.randint(0, len(prefix) - 1)],
                                      random.randint(1, 100))
            level = random.randint(1, 10)
            country_index = random.randint(0, 2)
            if country_index == 2:
                country_index = random.randint(0, len(countries) - 1)
            country = countries[country_index]
            is_bot = random.randint(0, 1)
            subscription_type = subscription_types[random.randint(0, len(subscription_types) - 1)]
            sql_string = f"INSERT IGNORE INTO players (player_id, alias, level, country, is_bot, subscription_type) " \
                         f"VALUES ('{player_id}','{alias}',{level},'{country}', {is_bot},'{subscription_type}' );"
            c2.execute(sql_string)
            last_count = last_count + 1
        conn.commit()

    with conn.cursor() as c3:
        if db_read_index == 0:
            c3.execute(f"INSERT INTO tracker VALUES (1, {last_count})")
        else:
            c3.execute(f"UPDATE tracker SET records = {last_count} where id = 1")
        conn.commit()
