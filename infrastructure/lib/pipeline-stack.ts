import * as cdk from "aws-cdk-lib";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Artifact bucket
    const artifactBucket = new s3.Bucket(this, "PipelineArtifacts", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: "expire-old-artifacts",
          expiration: cdk.Duration.days(30),
          enabled: true,
        },
      ],
    });

    // Pipeline artifacts
    const sourceOutput = new codepipeline.Artifact("SourceArtifact");
    const buildOutput = new codepipeline.Artifact("BuildArtifact");

    // Stage 1: Source (GitHub)
    const sourceAction =
      new codepipeline_actions.GitHubSourceAction({
        actionName: "GitHub_Source",
        owner: "Cloud-Service-Project",
        repo: "poc-backend-api",
        branch: "main",
        oauthToken: cdk.SecretValue.secretsManager("github-token"),
        output: sourceOutput,
        trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
      });

    // Stage 2: Build (Jenkins)
    const buildAction =
      new codepipeline_actions.JenkinsAction({
        actionName: "Jenkins_Build",
        jenkinsProvider:
          new codepipeline_actions.JenkinsProvider(
            this,
            "JenkinsProvider",
            {
              providerName: "poc-jenkins",
              serverUrl:
                "https://jenkins.your-domain.com",
              version: "1",
            }
          ),
        projectName: "poc-backend-build",
        type: codepipeline_actions.JenkinsActionType.BUILD,
        inputs: [sourceOutput],
        outputs: [buildOutput],
      });

    // Stage 3: Deploy (Elastic Beanstalk)
    const deployAction =
      new codepipeline_actions.ElasticBeanstalkDeployAction({
        actionName: "EB_Deploy",
        applicationName: "poc-enterprise-app",
        environmentName: "poc-backend-prod",
        input: buildOutput,
      });

    const pipeline = new codepipeline.Pipeline(this, "Pipeline", {
      pipelineName: "poc-enterprise-pipeline",
      artifactBucket,
      stages: [
        {
          stageName: "Source",
          actions: [sourceAction],
        },
        {
          stageName: "Build",
          actions: [buildAction],
        },
        {
          stageName: "Deploy",
          actions: [deployAction],
        },
      ],
    });

    new cdk.CfnOutput(this, "PipelineName", {
      value: pipeline.pipelineName,
      exportName: "PocPipelineName",
      description: "CodePipeline pipeline name",
    });

    new cdk.CfnOutput(this, "PipelineArn", {
      value: pipeline.pipelineArn,
      exportName: "PocPipelineArn",
      description: "CodePipeline pipeline ARN",
    });

    new cdk.CfnOutput(this, "ArtifactBucketName", {
      value: artifactBucket.bucketName,
      exportName: "PocPipelineArtifactBucket",
      description: "Pipeline artifact S3 bucket name",
    });
  }
}
