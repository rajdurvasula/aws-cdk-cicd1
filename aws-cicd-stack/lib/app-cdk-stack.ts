import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import { Construct } from 'constructs';

export interface AppCdkProps extends cdk.StackProps {
    ecrRepository: ecr.Repository;
}

export class AppCdkStack extends cdk.Stack {
    
    public readonly appVpc: ec2.Vpc;
    public readonly fargateService: ecsPatterns.ApplicationLoadBalancedFargateService;
    
    constructor(scope: Construct, id: string, props: AppCdkProps) {
        super(scope, id, props);
        
        const vpcCidr = this.node.tryGetContext("vpcCidr");
        
        this.appVpc = new ec2.Vpc(this, 'AppVpc', {
            cidr: vpcCidr,
            natGateways: 1,
            maxAzs: 2
        });
        
        // ECS Cluster
        const ecsCluster = new ecs.Cluster(this, `${id}EcsCluster`, {
            clusterName: `${id}EcsCluster`,
            vpc: this.appVpc
        });
        
        // Fargate
        this.fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, `${id}FargateService`, {
            cluster: ecsCluster,
            publicLoadBalancer: true,
            memoryLimitMiB: 1024,
            cpu: 512,
            desiredCount: 1,
            taskImageOptions: {
                image: ecs.ContainerImage.fromEcrRepository(props.ecrRepository),
                containerName: `${id}-testnode`,
                containerPort: 8080
            }
        });
    }
}