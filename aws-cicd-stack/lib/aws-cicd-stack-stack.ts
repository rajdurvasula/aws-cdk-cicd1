import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as cbuild from 'aws-cdk-lib/aws-codebuild';
import * as cpipeline from 'aws-cdk-lib/aws-codepipeline';
import * as cpipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';

export interface AwsCicdStackProps extends cdk.StackProps {
  ecrRepository: ecr.Repository,
  testEnvFargateService: ecsPatterns.ApplicationLoadBalancedFargateService
}

export class AwsCicdStackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsCicdStackProps) {
    super(scope, id, props);

    const region = cdk.Stack.of(this).region;

    const gitHubUser = this.node.tryGetContext("gitHubUser");
    const gitHubRepo = this.node.tryGetContext("gitHubRepo");
    const gitHubTokenSecret = this.node.tryGetContext("gitHubTokenSecret");
    
    // Source
    const gitHubSource = cbuild.Source.gitHub({
      owner: gitHubUser,
      repo: gitHubRepo,
      webhook: true,
      webhookFilters: [
        cbuild.FilterGroup.inEventOf(cbuild.EventAction.PUSH).andBranchIs('main')
      ]
    });
    
    // artifacts
    const sourceArtifact = new cpipeline.Artifact();
    const dockerBuildOutput = new cpipeline.Artifact();
    const testEnvOutput = new cpipeline.Artifact();

    //Build Project for Testing
    const testBuild = new cbuild.Project(this, 'test-node-build', {
      projectName: `${this.stackName}`,
      source: gitHubSource,
      environment: {
        buildImage: cbuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true
      },
      environmentVariables: {
        'IMAGE_REPO_URI': {
          value: props.ecrRepository.repositoryUri
        },
        'IMAGE_TAG': {
          value: 'latest'
        },
        'AWS_DEFAULT_REGION': {
          value: region
        }
      },
      badge: true,
      buildSpec: cbuild.BuildSpec.fromSourceFilename('buildspec_test.yaml')
    });

    // IAM Policy to Push Docker Image to ECR
    const dockerBuildRolePolicy = new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [ '*' ],
        actions: [
            "ecr:GetAuthorizationToken",
            "ecr:BatchCheckLayerAvailability",
            "ecr:GetDownloadUrlForLayer",
            "ecr:GetRepositoryPolicy",
            "ecr:DescribeRepositories",
            "ecr:ListImages",
            "ecr:DescribeImages",
            "ecr:BatchGetImage",
            "ecr:InitiateLayerUpload",
            "ecr:UploadLayerPart",
            "ecr:CompleteLayerUpload",
            "ecr:PutImage"
        ]
    });
    
    props.ecrRepository.grantPullPush(testBuild.role!);

    testBuild.addToRolePolicy(dockerBuildRolePolicy);    
    // Code Pipeline
    const pipeline = new cpipeline.Pipeline(this, 'node-pipeline', {
      pipelineName: 'node-pipeline',
      crossAccountKeys: false
    });
    
    // Stages and Actions
    // Get Source
    pipeline.addStage({
      stageName: 'get-source',
      actions: [
        new cpipeline_actions.GitHubSourceAction({
          actionName: 'GitHubSource',
          output: sourceArtifact,
          owner: gitHubUser,
          repo: gitHubRepo,
          oauthToken: cdk.SecretValue.secretsManager(gitHubTokenSecret),
          branch: 'main',
          trigger: cpipeline_actions.GitHubTrigger.WEBHOOK
        })
      ]
    });
    
    // Build and Push
    pipeline.addStage({
      stageName: 'test-build',
      actions: [
        new cpipeline_actions.CodeBuildAction({
          actionName: 'test-docker-build',
          input: sourceArtifact,
          project: testBuild,
          outputs: [
            dockerBuildOutput
          ]
        })
      ]
    });
    /*
    // Deploy to Test Env
    pipeline.addStage({
      stageName: 'deploy-test',
      actions: [
        new cpipeline_actions.EcsDeployAction({
          actionName: 'deploy-test-ecs',
          service: props.testEnvFargateService.service,
          input: dockerBuildOutput
        })
      ]
    });
    */
  }
}
