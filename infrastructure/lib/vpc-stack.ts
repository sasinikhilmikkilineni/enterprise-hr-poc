import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly dbSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "PocVpc", {
      vpcName: "poc-enterprise-vpc",
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    this.dbSecurityGroup = new ec2.SecurityGroup(this, "DbSecurityGroup", {
      vpc: this.vpc,
      securityGroupName: "poc-db-sg",
      description: "Allow MySQL traffic from within VPC only",
      allowAllOutbound: false,
    });

    this.dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(3306),
      "Allow MySQL from VPC CIDR"
    );

    new cdk.CfnOutput(this, "VpcId", {
      value: this.vpc.vpcId,
      exportName: "PocVpcId",
      description: "VPC ID",
    });

    new cdk.CfnOutput(this, "VpcCidr", {
      value: this.vpc.vpcCidrBlock,
      exportName: "PocVpcCidr",
      description: "VPC CIDR block",
    });

    new cdk.CfnOutput(this, "DbSecurityGroupId", {
      value: this.dbSecurityGroup.securityGroupId,
      exportName: "PocDbSecurityGroupId",
      description: "DB Security Group ID",
    });
  }
}
