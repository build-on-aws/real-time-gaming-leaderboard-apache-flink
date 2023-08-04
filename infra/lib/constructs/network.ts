import {Construct} from "constructs";
import {IVpc, SubnetType, Vpc} from "aws-cdk-lib/aws-ec2";

export class Network extends Construct {

    readonly vpc: IVpc;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        // Create main VPC
        this.vpc = new Vpc(this, 'vpc', {
            maxAzs: 2,
            enableDnsSupport: true,
            enableDnsHostnames: true,
            natGateways: 1,
            subnetConfiguration: [{
                subnetType: SubnetType.PUBLIC,
                name: 'Public'
            }, {
                subnetType: SubnetType.PRIVATE_WITH_EGRESS,
                name: 'Private'
            }]
        });

    }
}