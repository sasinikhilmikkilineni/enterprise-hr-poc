import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as rds from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

interface IamStackProps extends cdk.StackProps {
  secret: rds.DatabaseSecret;
  bucket: s3.Bucket;
}

export class IamStack extends cdk.Stack {
  public readonly role: iam.Role;
  public readonly instanceProfileName: string;

  constructor(scope: Construct, id: string, props: IamStackProps) {
    super(scope, id, props);

    const { secret, bucket } = props;

    this.role = new iam.Role(this, "EbInstanceRole", {
      roleName: "poc-eb-role",
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      description: "Instance role for Elastic Beanstalk - Enterprise HR PoC",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSElasticBeanstalkWebTier"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "CloudWatchAgentServerPolicy"
        ),
      ],
    });

    // Grant Secrets Manager read access
    secret.grantRead(this.role);

    // Grant S3 read + write
    bucket.grantReadWrite(this.role);

    // Additional permissions for S3 presigned URL generation
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
        resources: [`${bucket.bucketArn}/*`],
      })
    );

    // Explicit Secrets Manager access for SDK calls
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
        ],
        resources: [secret.secretArn],
      })
    );

    this.instanceProfileName = "poc-eb-instance-profile";

    const cfnProfile = new iam.CfnInstanceProfile(
      this,
      "EbInstanceProfile",
      {
        instanceProfileName: this.instanceProfileName,
        roles: [this.role.roleName],
      }
    );

    new cdk.CfnOutput(this, "RoleName", {
      value: this.role.roleName,
      exportName: "PocEbRoleName",
      description: "Elastic Beanstalk EC2 instance role name",
    });

    new cdk.CfnOutput(this, "RoleArn", {
      value: this.role.roleArn,
      exportName: "PocEbRoleArn",
      description: "Elastic Beanstalk EC2 instance role ARN",
    });

    new cdk.CfnOutput(this, "InstanceProfileName", {
      value: cfnProfile.instanceProfileName!,
      exportName: "PocEbInstanceProfileName",
      description: "Elastic Beanstalk instance profile name",
    });
  }
}
