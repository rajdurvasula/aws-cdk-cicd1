import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class EcrCdkStack extends cdk.Stack {
    
    public readonly ecrRepository: ecr.Repository;
    
    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);
        
        this.ecrRepository = new ecr.Repository(this, 'node-repo');
    }
}