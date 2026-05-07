# infrastructure — AWS CDK (TypeScript)

AWS CDK v2 TypeScript stacks for the Enterprise HR PoC. Provisions VPC, Aurora Serverless v2, S3, IAM, Elastic Beanstalk, and CodePipeline.

## Stack Overview

| Stack            | Resources                                            |
|------------------|------------------------------------------------------|
| `PocVpcStack`    | VPC, 2 AZs, public+private subnets, 1 NAT, DB SG   |
| `PocDatabaseStack` | Aurora Serverless v2 MySQL, Secrets Manager secret |
| `PocS3Stack`     | S3 bucket (versioned, encrypted, CORS)              |
| `PocIamStack`    | EC2 role, managed policies, instance profile        |
| `PocEbStack`     | EB Application + Environment (Node.js 20 AL2023)    |
| `PocPipelineStack` | CodePipeline → GitHub → Jenkins → EB             |

## Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 18+
- AWS CDK CLI: `npm install -g aws-cdk`

## Setup

```bash
# Install dependencies
npm install

# Bootstrap CDK (first time only per account/region)
cdk bootstrap aws://<account-id>/us-east-1

# Review changes
cdk diff --all

# Deploy all stacks (in dependency order)
cdk deploy --all
```

## Deploy Individual Stacks

```bash
cdk deploy PocVpcStack
cdk deploy PocDatabaseStack
cdk deploy PocS3Stack
cdk deploy PocIamStack
cdk deploy PocEbStack
cdk deploy PocPipelineStack
```

## Stack Outputs

After deploy, key outputs to note:

| Output                  | Stack             | Use                          |
|-------------------------|-------------------|------------------------------|
| `PocClusterEndpoint`    | DatabaseStack     | DB host for connection       |
| `PocDbSecretArn`        | DatabaseStack     | Secret to read credentials   |
| `PocHrDocsBucketName`   | S3Stack           | Bucket name for backend      |
| `PocEbEnvironmentUrl`   | EbStack           | Backend API base URL         |
| `PocPipelineName`       | PipelineStack     | CI/CD pipeline name          |

## Post-Deployment Steps

### 1. Import Database

```bash
# Get the cluster endpoint from CDK output
CLUSTER_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name PocDatabaseStack \
  --query "Stacks[0].Outputs[?OutputKey=='ClusterEndpoint'].OutputValue" \
  --output text)

# Import the employees dataset
mysql -h $CLUSTER_ENDPOINT -u admin -p employees < employees.sql
```

### 2. Store GitHub Token

```bash
aws secretsmanager create-secret \
  --name github-token \
  --secret-string "YOUR_GITHUB_PAT_HERE" \
  --region us-east-1
```

### 3. Update Jenkins URL

In `lib/pipeline-stack.ts`, update the `serverUrl` in `JenkinsProvider`:

```typescript
serverUrl: "https://jenkins.your-actual-domain.com",
```

Then redeploy:

```bash
cdk deploy PocPipelineStack
```

## Teardown

```bash
cdk destroy --all
```

> **Note:** All stacks use `removalPolicy: DESTROY`. Aurora, S3 bucket contents, and all resources will be permanently deleted on destroy.

## Architecture

```
GitHub (Cloud-Service-Project)
  └── CodePipeline
        ├── Source: GitHub webhook
        ├── Build: Jenkins
        └── Deploy: Elastic Beanstalk
              └── Node.js 20 (Amazon Linux 2023)
                    ├── IAM Instance Role → Secrets Manager
                    ├── IAM Instance Role → S3
                    └── Private VPC Subnet → Aurora Serverless v2
```
