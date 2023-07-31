import {Construct} from "constructs";
import {Bucket, IBucket} from "aws-cdk-lib/aws-s3";
import {CustomResource, Duration, RemovalPolicy} from "aws-cdk-lib";
import {Provider} from "aws-cdk-lib/custom-resources";
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {IRole} from "aws-cdk-lib/aws-iam";
import path = require('path');

export class JarsCustomResource extends Construct {

    readonly bucket: IBucket
    readonly uploadJars: CustomResource;

    constructor(scope: Construct, id: string, notebookRole: IRole) {
        super(scope, id);

        const jarSyncFolder: string = path.join(__dirname, '../../datagen-functions/jar-sync');

        // S3 bucket to upload all maven dependencies (jars) for MySQL CDC connector
        this.bucket = new Bucket(this, "bucket", {
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true
        });
        this.bucket.grantRead(notebookRole);

        const eventHandler = new Function(this, "custom-resource", {
            code: Code.fromAsset(jarSyncFolder),
            handler: "app.lambda_handler",
            runtime: Runtime.PYTHON_3_9,
            timeout: Duration.minutes(10),
            environment: {
                "JARS_BUCKET": this.bucket.bucketName
            }
        });

        this.bucket.grantWrite(eventHandler, "*.jar");
        const provider = new Provider(this, 'ResourceProvider', {
            onEventHandler: eventHandler
        });

        this.uploadJars = new CustomResource(this, 'UploadJars', {
            serviceToken: provider.serviceToken
        });
    }

}