import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  dbSecurityGroup: ec2.SecurityGroup;
}

export class DatabaseStack extends cdk.Stack {
  public readonly secret: rds.DatabaseSecret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { vpc, dbSecurityGroup } = props;

    this.secret = new rds.DatabaseSecret(this, "DbSecret", {
      secretName: "poc/db/credentials",
      username: "admin",
      dbname: "employees",
      replaceOnPasswordCriteriaChanges: true,
    });

    const cluster = new rds.DatabaseCluster(this, "AuroraCluster", {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
      }),
      writer: rds.ClusterInstance.serverlessV2("writer", {
        scaleWithWriter: true,
      }),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 4,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [dbSecurityGroup],
      defaultDatabaseName: "employees",
      credentials: rds.Credentials.fromSecret(this.secret),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      storageEncrypted: true,
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: "03:00-04:00",
      },
      cloudwatchLogsExports: ["error", "general", "slowquery"],
      monitoringInterval: cdk.Duration.seconds(60),
    });

    new cdk.CfnOutput(this, "ClusterEndpoint", {
      value: cluster.clusterEndpoint.hostname,
      exportName: "PocClusterEndpoint",
      description: "Aurora cluster writer endpoint",
    });

    new cdk.CfnOutput(this, "ClusterPort", {
      value: cluster.clusterEndpoint.port.toString(),
      exportName: "PocClusterPort",
      description: "Aurora cluster port",
    });

    new cdk.CfnOutput(this, "SecretArn", {
      value: this.secret.secretArn,
      exportName: "PocDbSecretArn",
      description: "DB credentials secret ARN",
    });

    new cdk.CfnOutput(this, "SecretName", {
      value: this.secret.secretName,
      exportName: "PocDbSecretName",
      description: "DB credentials secret name",
    });
  }
}
