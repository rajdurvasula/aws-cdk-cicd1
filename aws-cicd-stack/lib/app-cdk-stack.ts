import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export interface AppCdkProps extends cdk.StackProps {
    ecrRepository: ecr.Repository;
}

export class AppCdkStack extends cdk.Stack {
    
    public readonly appVpc: ec2.Vpc;
    
    constructor(scope: Construct, id: string, props: AppCdkProps) {
        super(scope, id, props);
        
        const vpcCidr = this.node.tryGetContext("vpcCidr");
        
        this.appVpc = new ec2.Vpc(this, 'AppVpc', {
            cidr: vpcCidr,
            natGateways: 1,
            maxAzs: 2
        });
    }
}