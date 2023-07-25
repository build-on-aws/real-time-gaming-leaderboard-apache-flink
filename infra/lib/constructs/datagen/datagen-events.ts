import {Construct} from "constructs";
import {Duration} from "aws-cdk-lib";
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {IStream} from "aws-cdk-lib/aws-kinesis";
import {Rule, Schedule} from "aws-cdk-lib/aws-events";
import {LambdaFunction} from "aws-cdk-lib/aws-events-targets";


const fs = require('fs');
import path = require('path');

interface DatagenEventsProps {
    eventStream: IStream
}

export class DatagenEvents extends Construct {

    constructor(scope: Construct, id: string, props: DatagenEventsProps) {
        super(scope, id);

        const datagenEventsFolder: string = path.join(__dirname, '../../../datagen-functions/events');

        // Lambda function data generator
        const dataGenFn = new Function(this, 'fn', {
            runtime: Runtime.PYTHON_3_9,
            handler: 'index.lambda_handler',
            code: Code.fromInline(fs.readFileSync(datagenEventsFolder + "/app.py").toString()),
            timeout: Duration.minutes(1),
            environment: {
                "KINESIS_STREAM_NAME": props.eventStream.streamName
            }
        });

        props.eventStream.grantWrite(dataGenFn);

        // Fixed schedule for data generation
        new Rule(this, 'trigger', {
            schedule: Schedule.rate(Duration.minutes(1)),
            targets: [new LambdaFunction(dataGenFn)]
        });

    }
}