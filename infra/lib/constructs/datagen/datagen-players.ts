import {Construct} from "constructs";
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {Duration} from "aws-cdk-lib";
import {Rule, Schedule} from "aws-cdk-lib/aws-events";
import {LambdaFunction} from "aws-cdk-lib/aws-events-targets";
import {ISecret} from "aws-cdk-lib/aws-secretsmanager";
import {ISecurityGroup, IVpc, Port, SubnetType} from "aws-cdk-lib/aws-ec2";

const fs = require('fs');
import path = require('path');

interface DataGenPlayersProps {
    secret: ISecret,
    vpc: IVpc,
    host: string,
    databaseSecurityGroup: ISecurityGroup
}

export class DatagenPlayers extends Construct {

    constructor(scope: Construct, id: string, props: DataGenPlayersProps) {
        super(scope, id);

        const playersFnFolder: string = path.join(__dirname, '../../../functions/players');

        // Lambda function data generator
        const dataGenFn = new Function(this, 'fn', {
            runtime: Runtime.PYTHON_3_9,
            handler: 'app.lambda_handler',
            code: Code.fromAsset(playersFnFolder, {
              bundling: {
                image: Runtime.PYTHON_3_9.bundlingImage,
                command: [
                  'bash', '-c',
                  'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
                ],
              },
            }),
            timeout: Duration.minutes(1),
            vpc: props.vpc,
            vpcSubnets: {subnetType: SubnetType.PRIVATE_WITH_EGRESS},
            environment: {
                "SECRET_ARN": props.secret.secretArn,
                "DATABASE_HOST": props.host
            }
        });

        dataGenFn.connections.allowTo(props.databaseSecurityGroup, Port.tcp(3306));
        props.secret.grantRead(dataGenFn);

        // Fixed schedule for data generation
        new Rule(this, 'trigger', {
            schedule: Schedule.rate(Duration.minutes(1)),
            targets: [new LambdaFunction(dataGenFn)]
        });

    }
}
