import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as path from 'path';

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3バケットを作成
    const bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: 'tech-stock-frontend-bucket-hayato-t08',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFrontディストリビューション
    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessIdentity(bucket), // S3バケットのオリジンを設定 S3Originは非推奨
      },
    });

    const projectRoot = path.join(__dirname, '../..');
    const frontendDir = path.join(projectRoot, 'frontend');

    // バケットにデプロイ
    new s3Deployment.BucketDeployment(this, 'DeployFrontend', {
      sources: [s3Deployment.Source.asset(path.join(frontendDir, 'out'))],
      destinationBucket: bucket,
    });

    // 出力
    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      description: 'フロントエンドS3バケット名',
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: 'https://' + distribution.distributionDomainName,
      description: 'CloudFrontディストリビューションドメイン',
    });
  }
}
