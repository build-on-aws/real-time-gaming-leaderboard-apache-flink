import {Construct} from "constructs";
import {CfnApplication} from "aws-cdk-lib/aws-kinesisanalyticsv2";
import {CfnRole, IRole} from "aws-cdk-lib/aws-iam";
import {ISecurityGroup, IVpc, SecurityGroup} from "aws-cdk-lib/aws-ec2";
import {CfnApplicationCloudWatchLoggingOptionV2} from "aws-cdk-lib/aws-kinesisanalytics";
import {Aws} from "aws-cdk-lib";
import {LogGroup, LogStream} from "aws-cdk-lib/aws-logs";
import {CfnDatabase} from "aws-cdk-lib/aws-glue";

interface ManagedFlinkNotebookProps {
    appName: string,
    role: IRole,
    vpc?: IVpc,
    glueDB: CfnDatabase
}

export class ManagedFlinkNotebook extends Construct {

    readonly applicationSecurityGroup?: ISecurityGroup

    constructor(scope: Construct, id: string, props: ManagedFlinkNotebookProps) {
        super(scope, id);

        const databaseArn = "arn:aws:glue:" + Aws.REGION + ":" + Aws.ACCOUNT_ID + ":database/" + props.glueDB.ref;

        let application = new CfnApplication(this, id + "-cfn", {
            applicationName: props.appName,
            runtimeEnvironment: "ZEPPELIN-FLINK-3_0",
            applicationMode: "INTERACTIVE",
            serviceExecutionRole: props.role.roleArn,
            applicationConfiguration: {
                flinkApplicationConfiguration: {
                    parallelismConfiguration: {
                        parallelism: 4,
                        configurationType: "CUSTOM"
                    }
                },
                zeppelinApplicationConfiguration: {
                    monitoringConfiguration: {
                        logLevel: "INFO"
                    },
                    catalogConfiguration: {
                        glueDataCatalogConfiguration: {
                            databaseArn: databaseArn
                        }
                    },
                    customArtifactsConfiguration: [{
                        artifactType: "DEPENDENCY_JAR",
                        mavenReference: {
                            groupId: 'org.apache.flink',
                            artifactId: "flink-sql-connector-kinesis",
                            version: "1.15.4"
                        }
                    }]
                }
            }
        });

        if (props.vpc) {

            this.applicationSecurityGroup = new SecurityGroup(this, "app-sg", {
                vpc: props.vpc
            });

            application = new CfnApplication(this, 'application', {
                runtimeEnvironment: "ZEPPELIN-FLINK-3_0",
                applicationMode: "INTERACTIVE",
                serviceExecutionRole: props.role.roleArn,
                applicationConfiguration: {
                    vpcConfigurations: [{
                        subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
                        securityGroupIds: [this.applicationSecurityGroup.securityGroupId]
                    }],
                    flinkApplicationConfiguration: {
                        parallelismConfiguration: {
                            parallelism: 4,
                            configurationType: "CUSTOM"
                        }
                    },
                    zeppelinApplicationConfiguration: {
                        monitoringConfiguration: {
                            logLevel: "INFO"
                        },
                        catalogConfiguration: {
                            glueDataCatalogConfiguration: {
                                databaseArn: databaseArn
                            }
                        },
                        customArtifactsConfiguration: [{
                            artifactType: "DEPENDENCY_JAR",
                            mavenReference: {
                                groupId: 'org.apache.flink',
                                artifactId: "flink-sql-connector-kinesis",
                                version: "1.15.4"
                            }
                        }]
                    }
                }
            });
        }

        const logGroup = new LogGroup(this, "logGroup");
        const logStream = new LogStream(this, "logStream", {
            logGroup: logGroup
        });

        application.addDependency(props.glueDB);
        application.addDependency(props.role.node.defaultChild as CfnRole);

        new CfnApplicationCloudWatchLoggingOptionV2(this, 'logging-attach', {
            applicationName: application.ref,
            cloudWatchLoggingOption: {
                logStreamArn: "arn:aws:logs:" + Aws.REGION + ":" + Aws.ACCOUNT_ID + ":log-group:" + logGroup.logGroupName + ":log-stream:" + logStream.logStreamName
            }
        });
    }

}