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
        eventsStream.grantRead(notebookCommon.notebookRole);

        // ------------------- Part 1: Ingestion Challenge Completed -------------------
        // Spin up new notebook
        new ManagedFlinkNotebook(this, "app", {
            appName: Aws.STACK_NAME + "-notebook",
            glueDB: notebookCommon.glueDB,
            role: notebookCommon.notebookRole
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

        // Spin up new notebook in VPC
        const managedFlinkNotebook = new ManagedFlinkNotebook(this, "app-in-vpc", {
            appName: Aws.STACK_NAME + "-notebook-in-vpc",
            glueDB: notebookCommon.glueDB,
            role: notebookCommon.notebookRole,
            vpc: network.vpc
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
        resultsStream.grantWrite(notebookCommon.notebookRole);



    }
}
