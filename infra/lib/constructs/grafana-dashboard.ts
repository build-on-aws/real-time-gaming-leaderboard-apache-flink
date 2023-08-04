import {Construct} from "constructs";
import {
    Instance,
    InstanceClass,
    InstanceSize,
    InstanceType,
    ISecurityGroup,
    IVpc,
    MachineImage,
    Port,
    SubnetType,
    UserData
} from "aws-cdk-lib/aws-ec2";
import {Asset} from "aws-cdk-lib/aws-s3-assets";
import {Aws, CfnOutput, RemovalPolicy} from "aws-cdk-lib";
import {Secret} from "aws-cdk-lib/aws-secretsmanager";
import path = require('path');


interface GrafanaDashboardProps {
    vpc: IVpc
    securityGroup: ISecurityGroup
}

export class GrafanaDashboard extends Construct {

    constructor(scope: Construct, id: string, props: GrafanaDashboardProps) {
        super(scope, id);

        const scriptPath: string = path.join(__dirname, '../../scripts/install-grafana.sh');
        const asset = new Asset(this, "install-grafana", {
            path: scriptPath
        });

        const secret = new Secret(this, "secret", {
            removalPolicy: RemovalPolicy.DESTROY,
            generateSecretString: {
                secretStringTemplate: '{"username":"admin"}',
                generateStringKey: "password",
                excludePunctuation: true
            }
        });

        // Using Grafana on EC2.
        const userData = UserData.forLinux();
        userData.addExecuteFileCommand({
            filePath: userData.addS3DownloadCommand({
                bucket: asset.bucket,
                bucketKey: asset.s3ObjectKey
            }),
            arguments: secret.secretArn + " " + Aws.REGION
        });

        const instance = new Instance(this, "grafana", {
            instanceType: InstanceType.of(InstanceClass.M5, InstanceSize.LARGE),
            machineImage: MachineImage.latestAmazonLinux2(),
            vpc: props.vpc,
            vpcSubnets: {subnetType: SubnetType.PUBLIC},
            userData: userData,
            userDataCausesReplacement: true
        });

        asset.grantRead(instance);
        secret.grantRead(instance);
        instance.connections.allowFromAnyIpv4(Port.tcp(3000));
        instance.connections.allowTo(props.securityGroup, Port.tcp(6379));

        new CfnOutput(this, "GrafanaURL", {
            value: "http://" + instance.instancePublicDnsName + ":3000",
            description: "Grafana server link"
        });

        new CfnOutput(this, "GrafanaCredentials", {
            value: "https://" + Aws.REGION + ".console.aws.amazon.com/secretsmanager/secret?name=" + secret.secretName,
            description: "Grafana login credentials"
        });
    }
}