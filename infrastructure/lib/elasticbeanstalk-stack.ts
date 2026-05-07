import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elasticbeanstalk from "aws-cdk-lib/aws-elasticbeanstalk";
import { Construct } from "constructs";

interface EbStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class EbStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EbStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    const privateSubnetIds = vpc.privateSubnets
      .map((s) => s.subnetId)
      .join(",");

    const publicSubnetIds = vpc.publicSubnets
      .map((s) => s.subnetId)
      .join(",");

    const application = new elasticbeanstalk.CfnApplication(
      this,
      "EbApplication",
      {
        applicationName: "poc-enterprise-app",
        description: "Enterprise HR PoC - Node.js Backend API",
      }
    );

    const environment = new elasticbeanstalk.CfnEnvironment(
      this,
      "EbEnvironment",
      {
        applicationName: application.applicationName!,
        environmentName: "poc-backend-prod",
        description: "Production environment - Enterprise HR PoC",
        solutionStackName:
          "64bit Amazon Linux 2023 v6.10.2 running Node.js 20",
        optionSettings: [
          // Instance profile
          {
            namespace: "aws:autoscaling:launchconfiguration",
            optionName: "IamInstanceProfile",
            value: "poc-eb-instance-profile",
          },
          // Network
          {
            namespace: "aws:ec2:vpc",
            optionName: "VPCId",
            value: vpc.vpcId,
          },
          {
            namespace: "aws:ec2:vpc",
            optionName: "Subnets",
            value: privateSubnetIds,
          },
          {
            namespace: "aws:ec2:vpc",
            optionName: "ELBSubnets",
            value: publicSubnetIds,
          },
          {
            namespace: "aws:ec2:vpc",
            optionName: "AssociatePublicIpAddress",
            value: "false",
          },
          // Auto Scaling
          {
            namespace: "aws:autoscaling:asg",
            optionName: "MinSize",
            value: "1",
          },
          {
            namespace: "aws:autoscaling:asg",
            optionName: "MaxSize",
            value: "4",
          },
          // Environment variables
          {
            namespace: "aws:elasticbeanstalk:application:environment",
            optionName: "NODE_ENV",
            value: "production",
          },
          {
            namespace: "aws:elasticbeanstalk:application:environment",
            optionName: "AWS_REGION",
            value: "us-east-1",
          },
          {
            namespace: "aws:elasticbeanstalk:application:environment",
            optionName: "AWS_SECRET_NAME",
            value: "poc/db/credentials",
          },
          {
            namespace: "aws:elasticbeanstalk:application:environment",
            optionName: "S3_BUCKET",
            value: "enterprise-hr-docs-poc",
          },
          {
            namespace: "aws:elasticbeanstalk:application:environment",
            optionName: "OKTA_ISSUER",
            value:
              "https://integrator-3623755.okta.com/oauth2/default",
          },
          {
            namespace: "aws:elasticbeanstalk:application:environment",
            optionName: "OKTA_CLIENT_ID",
            value: "0oa12qgbqpsJsIGgc698",
          },
          // Health reporting
          {
            namespace: "aws:elasticbeanstalk:healthreporting:system",
            optionName: "SystemType",
            value: "enhanced",
          },
          // Load balancer
          {
            namespace: "aws:elasticbeanstalk:environment",
            optionName: "EnvironmentType",
            value: "LoadBalanced",
          },
          {
            namespace: "aws:elasticbeanstalk:environment",
            optionName: "LoadBalancerType",
            value: "application",
          },
          // Health check
          {
            namespace: "aws:elasticbeanstalk:application",
            optionName: "Application Healthcheck URL",
            value: "/health",
          },
        ],
      }
    );

    environment.addDependency(application);

    new cdk.CfnOutput(this, "ApplicationName", {
      value: application.applicationName!,
      exportName: "PocEbApplicationName",
      description: "Elastic Beanstalk application name",
    });

    new cdk.CfnOutput(this, "EnvironmentName", {
      value: environment.environmentName!,
      exportName: "PocEbEnvironmentName",
      description: "Elastic Beanstalk environment name",
    });

    new cdk.CfnOutput(this, "EnvironmentUrl", {
      value: environment.attrEndpointUrl,
      exportName: "PocEbEnvironmentUrl",
      description: "Elastic Beanstalk environment endpoint URL",
    });
  }
}
