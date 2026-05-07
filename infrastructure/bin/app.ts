#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { VpcStack } from "../lib/vpc-stack";
import { DatabaseStack } from "../lib/database-stack";
import { S3Stack } from "../lib/s3-stack";
import { IamStack } from "../lib/iam-stack";
import { EbStack } from "../lib/elasticbeanstalk-stack";
import { PipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: "us-east-1",
};

const vpc = new VpcStack(app, "PocVpcStack", {
  env,
  description: "Enterprise HR PoC — VPC, subnets, NAT gateway, security groups",
  tags: { Project: "poc-enterprise-hr", Environment: "production" },
});

const db = new DatabaseStack(app, "PocDatabaseStack", {
  env,
  vpc: vpc.vpc,
  dbSecurityGroup: vpc.dbSecurityGroup,
  description: "Enterprise HR PoC — Aurora Serverless v2 MySQL cluster",
  tags: { Project: "poc-enterprise-hr", Environment: "production" },
});

const s3Stack = new S3Stack(app, "PocS3Stack", {
  env,
  description: "Enterprise HR PoC — S3 bucket for HR document storage",
  tags: { Project: "poc-enterprise-hr", Environment: "production" },
});

const iam = new IamStack(app, "PocIamStack", {
  env,
  secret: db.secret,
  bucket: s3Stack.bucket,
  description: "Enterprise HR PoC — IAM roles and instance profiles",
  tags: { Project: "poc-enterprise-hr", Environment: "production" },
});

new EbStack(app, "PocEbStack", {
  env,
  vpc: vpc.vpc,
  description: "Enterprise HR PoC — Elastic Beanstalk app and environment",
  tags: { Project: "poc-enterprise-hr", Environment: "production" },
});

new PipelineStack(app, "PocPipelineStack", {
  env,
  description: "Enterprise HR PoC — CodePipeline CI/CD pipeline",
  tags: { Project: "poc-enterprise-hr", Environment: "production" },
});

// Enforce ordering
db.addDependency(vpc);
iam.addDependency(db);
iam.addDependency(s3Stack);
