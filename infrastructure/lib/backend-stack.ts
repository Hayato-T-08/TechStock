import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //dynamodb table
    const articlesTable = new dynamodb.Table(this, 'ArticlesTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'ArticlesTable',
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    articlesTable.addGlobalSecondaryIndex({
      indexName: 'TitleIndex',
      partitionKey: { name: 'title', type: dynamodb.AttributeType.STRING },
      readCapacity: 5,
      writeCapacity: 5,
    });

    const projectRoot = path.join(__dirname, '../..');
    const backendDir = path.join(projectRoot, 'backend');

    // Lambda関数を作成
    const honoLambda = new lambda.Function(this, 'techStockLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(backendDir, 'dist')),
      environment: {
        ENV: process.env.ENV ?? 'production',
        TABLE_NAME: articlesTable.tableName,
        FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
        QIITA_API_URL: process.env.QIITA_API_URL ?? 'https://qiita.com/api/v2',
        QIITA_USER_ID: process.env.QIITA_USER_ID ?? 'tech-stock',
      },
      timeout: cdk.Duration.seconds(60), // タイムアウトを60秒に増加
    });

    //dynamodb tableにアクセスするための権限を与える
    articlesTable.grantReadWriteData(honoLambda);

    //api gateway
    const api = new apigw.LambdaRestApi(this, 'techStockApi', {
      handler: honoLambda,
    });
    //apiKeyの設定をあとで追加する

    //api gatewayのエンドポイントを出力
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gatewayのエンドポイント',
    });

    //EventBridgeのルールを作成
    new events.Rule(this, 'fetchQiitaRule', {
      schedule: events.Schedule.cron({
        minute: '15',
        hour: '30',
      }), //毎日0時30分に実行
      targets: [
        new targets.LambdaFunction(honoLambda, {
          event: events.RuleTargetInput.fromObject({
            source: 'eventbridge',
            action: 'fetchQiita',
          }),
        }),
      ],
    });
  }
}
