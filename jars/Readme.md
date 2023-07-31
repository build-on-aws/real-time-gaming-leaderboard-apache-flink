# Place to build fat jar

This directory contains [pom.xml](pom.xml)
with [MySQL CDC Connector](https://github.com/ververica/flink-cdc-connectors/blob/master/docs/content/connectors/mysql-cdc.md)
dependencies and shed plugin to create fat jar in target folder.

Pre-built version of jar is committed already
as [fat-jar-mysql-cdc-1.0-SNAPSHOT.jar](fat-jar-mysql-cdc-1.0-SNAPSHOT.jar)

Jar is created using below command on JDK 20 runtime

```shell
mvn clean package

```