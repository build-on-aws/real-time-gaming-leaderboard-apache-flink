## Real time gaming leaderboard using Apache Flink

This repository supports five part series about the streaming analytics on AWS and In this video series, we are building
real-time gaming leaderboard application based on real use case to learn all parts of streaming architecture including

* Data Ingestion
* Real-time enrichment using database Change data capture (CDC)
* Data Processing
* Computing results, storing them and
* Visualisation

In this series you will also learn advance analytics techniques like

* Control channel technique for A/B testing, feature switching and parameter updates with zero downtime
* Handling late data arrival
* Exactly-once processing (data-duplication avoidance) and
* Storage of historical data with ability of on-demand replay.

## Structure

This repository contains two folders

1. [infra](infra) which contains aws-cdk source code of the AWS infrastructure
2. [notebooks](notebooks) which contains Amazon Managed Service for Apache Flink Studio (Zeppelin) notebooks.

Repository has two git branches for each section of the learning objective.

- With module number and `setup` post-fix. Example: `1-ingestion-setup`
- With module number and `answer` post-fix. Example: `1-ingestion-answer`

You should check out respective `setup` branch to create infrastructure setup required for you to start working on given
module. `answer` branch contains answer of a challenge.

## Progressive modules

You can check out any of the below branch to directly start learning from that point on-wards or download source code at
that level from the [tags](https://github.com/build-on-aws/real-time-gaming-leaderboard-apache-flink/tags)

1. [1-ingestion-setup](https://github.com/build-on-aws/real-time-gaming-leaderboard-apache-flink/tree/1-ingestion-setup):
   Sets up kinesis data stream, notebook role and data generator to automatically publish
   events. [part-1-ingestion-setup.zpln](./notebooks/part-1-ingestion-setup.zpln) as challenge setup notebook.
   ![](./img/Architecture-1-ingestion.jpg)
2. [1-ingestion-answer](https://github.com/build-on-aws/real-time-gaming-leaderboard-apache-flink/tree/1-ingestion-answer):
   Sets up Amazon Managed Service for Apache Flink Studio (Flink Zeppelin Notebook) application and
   includes [part-1-ingestion-answer.zpln](./notebooks/part-1-ingestion-answer.zpln) as challenge answer.
3. [2-cdc-enrichment-setup](https://github.com/build-on-aws/real-time-gaming-leaderboard-apache-flink/tree/2-cdc-enrichment-setup):
   Adds setup of MySQL database, data generator for MySQL, Connectivity between studio notebook and
   MySQL. [part-2-cdc-enrichment-setup.zpln](./notebooks/part-2-cdc-enrichment-setup.zpln) as challenge setup notebook.
   ![](./img/Architecture-2-enrichment-mysql-cdc.jpg)
4. [2-cdc-enrichment-answer](https://github.com/build-on-aws/real-time-gaming-leaderboard-apache-flink/tree/2-cdc-enrichment-answer):
   includes [part-2-cdc-enrichment-answer.zpln](./notebooks/part-2-cdc-enrichment-answer.zpln) as challenge answer.
5. [3-process-store-visualize-setup](https://github.com/build-on-aws/real-time-gaming-leaderboard-apache-flink/tree/3-process-store-visualize-setup):
   Adds new kinesis data stream to receive Redis queries, Lambda to execute those to Amazon MemoryDB and Grafana
   installed on EC2 for
   visualization.  [part-3-process-store-visualize-setup.zpln](./notebooks/part-3-process-store-visualize-setup.zpln) as
   challenge setup notebook.
   ![](img/Architecture-3-processing-storage-redis-grafana.jpg)
6. [3-process-store-visualize-answer](https://github.com/build-on-aws/real-time-gaming-leaderboard-apache-flink/tree/3-process-store-visualize-answer):
   includes [part-3-process-store-visualize-answer.zpln](./notebooks/part-3-process-store-visualize-answer.zpln) as
   challenge answer.
7. [4-dynamic-config-setup](https://github.com/build-on-aws/real-time-gaming-leaderboard-apache-flink/tree/4-dynamic-config-setup):
   Adds new kinesis data stream and Lambda to publish config updates to Amazon Managed Service for Apache
   Flink. [part-4-dynamic-config-setup.zpln](./notebooks/part-4-dynamic-config-setup.zpln) as challenge setup notebook.
   ![](img/Architecture-4-dynamic-config.jpg)
8. [4-dynamic-config-answer](https://github.com/build-on-aws/real-time-gaming-leaderboard-apache-flink/tree/4-dynamic-config-answer):
   includes [part-4-dynamic-config-answer.zpln](./notebooks/part-4-dynamic-config-answer.zpln) as
   challenge answer.
9. [5-archive-and-replay-setup](https://github.com/build-on-aws/real-time-gaming-leaderboard-apache-flink/tree/5-archive-and-replay-setup):
   Adds two new Amazon Managed Service for Apache Flink applications. One to store data to S3 and one to
   replay. [part-5-archive-and-replay-setup.zpln](./notebooks/part-5-archive-and-replay-setup.zpln) as challenge setup
   notebook.
   ![](img/Architecture-5-late-arrival-exactly-once-history-replay.jpg)
8. [5-archive-and-replay-answer](https://github.com/build-on-aws/real-time-gaming-leaderboard-apache-flink/tree/5-archive-and-replay-answer):
   includes [part-5-archive-and-replay-answer.zpln](./notebooks/part-5-archive-and-replay-answer.zpln) as
   challenge answer.