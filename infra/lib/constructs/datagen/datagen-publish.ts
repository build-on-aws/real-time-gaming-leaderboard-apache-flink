import {Construct} from "constructs";
import {Aws, CfnOutput} from "aws-cdk-lib";
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {PolicyStatement} from "aws-cdk-lib/aws-iam";


const fs = require('fs');
import path = require('path');


export class DatagenPublish extends Construct {

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const datagenEventsFolder: string = path.join(__dirname, '../../../functions/publish');

        // Lambda function data generator
        const dataGenFn = new Function(this, 'fn', {
            runtime: Runtime.PYTHON_3_9,
            handler: 'app.lambda_handler',
            code: Code.fromAsset(datagenEventsFolder)
        });

        dataGenFn.addToRolePolicy(new PolicyStatement({
            actions: ["kinesis:PutRecord"],
            resources: ["arn:aws:kinesis:" + Aws.REGION + ":" + Aws.ACCOUNT_ID + ":stream/" + Aws.STACK_NAME + "-*"]
        }));

        new CfnOutput(this, "PublishFnUrl", {
            value: "https://" + Aws.REGION + ".console.aws.amazon.com/lambda/home?region=" + Aws.REGION + "#/functions/" + dataGenFn.functionName + "?tab=code",
            description: "Config publish lambda URL"
        });
    }
}