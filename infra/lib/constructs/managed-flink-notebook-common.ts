import {Construct} from "constructs";
import {Aws} from "aws-cdk-lib";
import {PolicyDocument, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {CfnDatabase} from "aws-cdk-lib/aws-glue";


export class ManagedFlinkNotebookCommon extends Construct {

    readonly notebookRole: Role
    readonly glueDB: CfnDatabase


    constructor(scope: Construct, id: string) {
        super(scope, id);

        // Amazon Managed Service for Apache FLink Studio notebook common glue database
        this.glueDB = new CfnDatabase(this, 'glue-db', {
            catalogId: Aws.ACCOUNT_ID,
            databaseInput: {
                name: "leaderboard"
            }
        });

        const databaseArn = "arn:aws:glue:" + Aws.REGION + ":" + Aws.ACCOUNT_ID + ":database/" + this.glueDB.ref;

        // Amazon Managed Service for Apache FLink Studio notebook common role
        this.notebookRole = new Role(this, 'notebook-role', {
            assumedBy: new ServicePrincipal('kinesisanalytics.amazonaws.com'),
            inlinePolicies: {
                "defaultInlinePolicy": new PolicyDocument({
                    statements: [new PolicyStatement({
                        actions: [
                            "ec2:DescribeVpcs",
                            "ec2:DescribeSubnets",
                            "ec2:DescribeSecurityGroups",
                            "ec2:DescribeDhcpOptions",
                            "ec2:CreateNetworkInterface",
                            "ec2:CreateNetworkInterfacePermission",
                            "ec2:DescribeNetworkInterfaces",
                            "ec2:DeleteNetworkInterface"
                        ],
                        resources: ["*"]
                    }), new PolicyStatement({
                        actions: [
                            "glue:GetDatabase",
                            "glue:GetDatabases",
                            "glue:*Table",
                            "glue:*Tables",
                            "glue:GetUserDefinedFunction",
                            "glue:*Partitions",
                            "logs:PutLogEvents",
                            "logs:DescribeLogGroups",
                            "logs:DescribeLogStreams",
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "s3:GetObject"
                        ], resources: [
                            databaseArn,
                            "arn:aws:glue:" + Aws.REGION + ":" + Aws.ACCOUNT_ID + ":database/hive",
                            "arn:aws:glue:" + Aws.REGION + ":" + Aws.ACCOUNT_ID + ":catalog",
                            "arn:aws:glue:" + Aws.REGION + ":" + Aws.ACCOUNT_ID + ":table/" + this.glueDB.ref + "/*",
                            "arn:aws:glue:" + Aws.REGION + ":" + Aws.ACCOUNT_ID + ":userDefinedFunction/" + this.glueDB.ref + "/*",
                            "arn:aws:logs:" + Aws.REGION + ":" + Aws.ACCOUNT_ID + ":log-group:*",
                            "arn:aws:logs:" + Aws.REGION + ":" + Aws.ACCOUNT_ID + ":log-group:*:*",
                            "arn:aws:logs:" + Aws.REGION + ":" + Aws.ACCOUNT_ID + ":log-group:*:log-stream:*"
                        ]
                    })]
                })
            }
        });
    }

}