import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Stream, StreamEncryption, StreamMode} from "aws-cdk-lib/aws-kinesis";
import {ManagedFlinkNotebookCommon} from "./constructs/managed-flink-notebook-common";
import {DatagenEvents} from "./constructs/datagen/datagen-events";

export class GamingLeaderboardStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // ------------------- Part 1: Ingestion -------------------
        // Kinesis Data Stream events
        const eventsStream = new Stream(this, 'events', {
            streamMode: StreamMode.ON_DEMAND,
            encryption: StreamEncryption.MANAGED
        });

        // Data generator generating racing events on eventStream
        new DatagenEvents(this, "DatagenEvents", {eventStream: eventsStream});

        // Notebook common role for you to use.
        const notebookCommon = new ManagedFlinkNotebookCommon(this, "notebook-common");
        eventsStream.grantRead(notebookCommon.notebookRole);
    }
}
