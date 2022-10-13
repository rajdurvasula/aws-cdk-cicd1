# aws-cdk-cicd1

AWS CDK Typescript project to setup:
- VPC
  - 2 Public Subnets
  - 2 Private Subnets
  - IGW
  - 1 NGW
  - Corresponding Route Tables
  - Security Group
- ECR
  - Simple NodeJS app Image
- CodePipeline with
  - GitHub Source with *Webhook*
  - CodeBuild Project to build and push Container Image to ECR

## Prerequisites
- Create Secret in SecretsManager for GitHub PAT
  - This is referred by code
- Authorize CodeBuild to create hook in GitHub Repo
```
aws codebuild import-source-credentials \
 --server-type GITHUB --auth-type PERSONAL_ACCESS_TOKEN --token <GITHUB-PAT> 
```

## Project Details
- `aws-cicd-stack` folder comprises of 3 Stacks:
  - app-cdk-stack.ts
  - aws-cicd-stack-stack.ts
  - ecr-cdk-stack.ts
- Using Context Keys
  - Refer to: `cdk.context.json`

## CDK Build Steps
- Setup NodeJS, CDK runtime
- Clone this Repo
- Go to Dir: `aws-cdk-stack`
- Install NodeJS dependencies
```
npm install
```

## CDK Deployment steps
- Go to Dir: `aws-cdk-stack`
- Deploy all stacks
```
cdk deploy --all
```
