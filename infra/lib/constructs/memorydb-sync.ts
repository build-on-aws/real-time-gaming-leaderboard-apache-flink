import {Construct} from "constructs";
import {Code, Function, Runtime, StartingPosition} from "aws-cdk-lib/aws-lambda";
import {ISecurityGroup, IVpc, Port, SecurityGroup, SubnetType} from "aws-cdk-lib/aws-ec2";
import {IStream} from "aws-cdk-lib/aws-kinesis";
import {KinesisEventSource} from "aws-cdk-lib/aws-lambda-event-sources";
import {CfnCluster, CfnSubnetGroup} from "aws-cdk-lib/aws-memorydb";
import {Aws, CfnOutput} from "aws-cdk-lib";

const fs = require('fs');
import path = require('path');

interface MemorydbSyncProps {
    vpc: IVpc
    stream: IStream
}

export class MemorydbSync extends Construct {

    readonly redisSecurityGroup: ISecurityGroup
    readonly redisHost: string

    constructor(scope: Construct, id: string, props: MemorydbSyncProps) {
        super(scope, id);
        const redisSyncFunctionCode: string = path.join(__dirname, '../../functions/redis-sync');

        const lambdaSecurityGroup = new SecurityGroup(this, "lambda-sg", {
            vpc: props.vpc
        });

        this.redisSecurityGroup = new SecurityGroup(this, "redis-sg", {
            vpc: props.vpc
        });
        this.redisSecurityGroup.addIngressRule(lambdaSecurityGroup, Port.tcp(6379));

        const subnetGroupName = "leaderboard-subnet-" + Aws.REGION

        const cfnSubnetGroup = new CfnSubnetGroup(this, "s-group", {
            subnetGroupName: subnetGroupName,
            subnetIds: props.vpc.privateSubnets.map(s => s.subnetId)
        });
        const cfnCluster = new CfnCluster(this, "memorydb", {
            aclName: "open-access",
            clusterName: "leaderboard-" + Aws.REGION,
            nodeType: "db.r6g.large",
            numShards: 1,
            numReplicasPerShard: 0,
            tlsEnabled: false,
            engineVersion: "7.0",
            securityGroupIds: [this.redisSecurityGroup.securityGroupId],
            subnetGroupName: subnetGroupName
        });
        cfnCluster.addDependency(cfnSubnetGroup);
        this.redisHost = cfnCluster.attrClusterEndpointAddress;

        const fn = new Function(this, "fn", {
            code: Code.fromAsset(redisSyncFunctionCode),
            handler: "app.lambda_handler",
            runtime: Runtime.PYTHON_3_9,
            vpc: props.vpc,
            securityGroups: [lambdaSecurityGroup],
            vpcSubnets: {subnetType: SubnetType.PRIVATE_WITH_EGRESS},
            environment: {
                "REDIS_HOST": this.redisHost
            }
        });

        fn.addEventSource(new KinesisEventSource(props.stream, {
            startingPosition: StartingPosition.LATEST,
            batchSize: 5
        }));

        new CfnOutput(this, "RedisHost", {
            value: "redis://" + this.redisHost + ":6379",
            description: "Redis host address"
        });
    }
}