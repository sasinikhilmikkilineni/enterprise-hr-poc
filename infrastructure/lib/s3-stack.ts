import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class S3Stack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.bucket = new s3.Bucket(this, "HrDocsBucket", {
      bucketName: "enterprise-hr-docs-poc",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          exposedHeaders: [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2",
          ],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          id: "expire-old-versions",
          noncurrentVersionExpiration: cdk.Duration.days(30),
          enabled: true,
        },
      ],
    });

    new cdk.CfnOutput(this, "BucketName", {
      value: this.bucket.bucketName,
      exportName: "PocHrDocsBucketName",
      description: "HR Documents S3 bucket name",
    });

    new cdk.CfnOutput(this, "BucketArn", {
      value: this.bucket.bucketArn,
      exportName: "PocHrDocsBucketArn",
      description: "HR Documents S3 bucket ARN",
    });
  }
}
