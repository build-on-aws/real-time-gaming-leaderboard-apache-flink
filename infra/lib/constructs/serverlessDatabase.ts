import {Construct} from "constructs";
import {
    Instance,
    InstanceClass,
    InstanceSize,
    InstanceType,
    ISecurityGroup,
    IVpc,
    MachineImage,
    SecurityGroup,
    SubnetType,
    UserData
} from "aws-cdk-lib/aws-ec2";
import {AuroraMysqlEngineVersion, ClusterInstance, DatabaseCluster, DatabaseClusterEngine} from "aws-cdk-lib/aws-rds";
import {Aws, RemovalPolicy} from "aws-cdk-lib";
import {ISecret, Secret} from "aws-cdk-lib/aws-secretsmanager";
import {Asset} from "aws-cdk-lib/aws-s3-assets";

const fs = require('fs');
import path = require('path');

interface ServerlessDatabaseProps {
    vpc: IVpc
}

export class ServerlessDatabase extends Construct {

    readonly securityGroup: ISecurityGroup
    readonly secret?: ISecret
    readonly hostAddress: string

    constructor(scope: Construct, id: string, props: ServerlessDatabaseProps) {
        super(scope, id);

        this.securityGroup = new SecurityGroup(this, "db-sg", {
            vpc: props.vpc
        });

        // Set variable to true to use Aurora MySQL as database.
        const useAuroraMySQL = false;

        if (useAuroraMySQL) {
            const databaseCluster = new DatabaseCluster(this, "cluster", {
                engine: DatabaseClusterEngine.auroraMysql({version: AuroraMysqlEngineVersion.VER_3_03_0}),
                writer: ClusterInstance.serverlessV2("writer"),
                serverlessV2MinCapacity: 1,
                serverlessV2MaxCapacity: 2,
                vpc: props.vpc,
                defaultDatabaseName: "gaming",
                removalPolicy: RemovalPolicy.DESTROY
            });

            this.secret = databaseCluster.secret;
            this.hostAddress = databaseCluster.clusterEndpoint.hostname;
        } else {

            this.secret = new Secret(this, "secret", {
                removalPolicy: RemovalPolicy.DESTROY,
                generateSecretString: {
                    secretStringTemplate: '{"username":"admin", "database":"gaming", "engine":"mysql"}',
                    generateStringKey: "password",
                    excludePunctuation: true
                }
            });

            const scriptPath: string = path.join(__dirname, '../../scripts/install-mysql.sh');
            const asset = new Asset(this, "install-mysql", {
                path: scriptPath
            });
            // Using MySQL docker on EC2 in favour of provisioning speed and costs.
            const userData = UserData.forLinux();
            userData.addExecuteFileCommand({
                filePath: userData.addS3DownloadCommand({
                    bucket: asset.bucket,
                    bucketKey: asset.s3ObjectKey
                }),
                arguments: this.secret.secretArn + " " + Aws.REGION
            });
            const instance = new Instance(this, "docker-mysql", {
                instanceType: InstanceType.of(InstanceClass.M5, InstanceSize.LARGE),
                machineImage: MachineImage.latestAmazonLinux2(),
                vpc: props.vpc,
                securityGroup: this.securityGroup,
                vpcSubnets: {subnetType: SubnetType.PRIVATE_WITH_EGRESS},
                userData: userData,
                userDataCausesReplacement: true
            });
            asset.grantRead(instance);
            this.secret.grantRead(instance);

            this.hostAddress = instance.instancePrivateDnsName;
        }


    }
}