import {Aws, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Stream, StreamEncryption, StreamMode} from "aws-cdk-lib/aws-kinesis";
import {ManagedFlinkNotebookCommon} from "./constructs/managed-flink-notebook-common";
import {DatagenEvents} from "./constructs/datagen/datagen-events";
import {ManagedFlinkNotebook} from "./constructs/managed-flink-notebook";
import {Network} from "./constructs/network";
import {ServerlessDatabase} from "./constructs/serverless-database";
import {DatagenPlayers} from "./constructs/datagen/datagen-players";
import {Port} from "aws-cdk-lib/aws-ec2";
import {MemorydbSync} from "./constructs/memorydb-sync";
import {GrafanaDashboard} from "./constructs/grafana-dashboard";
import {DatagenPublish} from "./constructs/datagen/datagen-publish";

export class GamingLeaderboardStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // ------------------- Part 1: Ingestion -------------------
        // Kinesis Data Stream events
        const eventsStream = new Stream(this, 'events', {
            streamName: Aws.STACK_NAME + "-events",
            streamMode: StreamMode.ON_DEMAND,
            encryption: StreamEncryption.MANAGED
        });

        // Data generator generating racing events on eventStream
        new DatagenEvents(this, "DatagenEvents", {eventStream: eventsStream});

        // Notebook common role for you to use.
        const notebookCommon = new ManagedFlinkNotebookCommon(this, "notebook-common");

        // ------------------- Part 1: Ingestion Challenge Completed -------------------
        // Spin up new notebook
        new ManagedFlinkNotebook(this, "app", {
            appName: Aws.STACK_NAME + "-notebook",
            glueDB: notebookCommon.glueDB,
            role: notebookCommon.notebookRole,
            jarAsset: notebookCommon.jarAsset
        });

        // ------------------- Part 2: CDC Enrichment setup -------------------
        // VPC with private and public subnets for database
        const network = new Network(this, "network");
        // MySQL database setup
        const serverlessDatabase = new ServerlessDatabase(this, "player-db", {vpc: network.vpc});

        // Data generator updating players data in MySQL players table.
        new DatagenPlayers(this, "DatagenPlayers", {
            databaseSecurityGroup: serverlessDatabase.securityGroup,
            host: serverlessDatabase.hostAddress,
            secret: serverlessDatabase.secret,
            vpc: network.vpc
        });

        // ------------------- Part 2: Move notebook to VPC Challenge Completed -------------------
        // Spin up new notebook in VPC
        const managedFlinkNotebook = new ManagedFlinkNotebook(this, "app-in-vpc", {
            appName: Aws.STACK_NAME + "-notebook-in-vpc",
            glueDB: notebookCommon.glueDB,
            role: notebookCommon.notebookRole,
            vpc: network.vpc,
            jarAsset: notebookCommon.jarAsset
        });
        if (managedFlinkNotebook.applicationSecurityGroup) {
            serverlessDatabase.securityGroup.addIngressRule(managedFlinkNotebook.applicationSecurityGroup, Port.tcp(3306))
        }

        // ------------------- Part 3: Gaming leaderboard processing, storage and visual dashboard -------------------
        // Kinesis Data Stream results
        const resultsStream = new Stream(this, 'results', {
            streamName: Aws.STACK_NAME + "-results",
            streamMode: StreamMode.ON_DEMAND,
            encryption: StreamEncryption.MANAGED
        });

        // Sync redis commands from results stream tp MemoryDB for Redis
        const memorydbSync = new MemorydbSync(this, "MemorydbSync", {vpc: network.vpc, stream: resultsStream});
        // Connect grafana to MemoryDB for Redis for the dashboard
        new GrafanaDashboard(this, "GrafanaDashboard", {
            vpc: network.vpc,
            securityGroup: memorydbSync.redisSecurityGroup
        });

        // ------------------- Part 4: Dynamic config -------------------
        // Kinesis Data Stream dynamic config
        new Stream(this, 'config', {
            streamName: Aws.STACK_NAME + "-config",
            streamMode: StreamMode.PROVISIONED,
            shardCount: 1,
            encryption: StreamEncryption.MANAGED
        });

        // Publish function for pushing new event to control channel
        new DatagenPublish(this, "DatagenPublish");

        // ------------------- Part 5: Archival and Replay -------------------
        // Create new stream from the console or run below code to auto complete setup
        new Stream(this, 'replay', {
            streamName: Aws.STACK_NAME + "-replay",
            streamMode: StreamMode.ON_DEMAND,
            encryption: StreamEncryption.MANAGED
        });
    }
}
