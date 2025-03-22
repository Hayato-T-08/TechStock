import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as child_process from 'child_process';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
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

    //lambda function
    const projectRoot = path.join(__dirname, '../..');
    const backendDir = path.join(projectRoot, 'backend');

    // バンドルするためのディレクトリを作成
    const distDir = path.join(backendDir, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // バックエンドコードをビルド
    console.log('Building backend code...');
    try {
      child_process.execSync(`cd ${backendDir} && npm run build`, {
        stdio: 'inherit',
      });
    } catch (error) {
      console.error('Failed to build backend code:', error);
      throw error;
    }

    // Lambda関数を作成
    const honoLambda = new lambda.Function(this, 'techStockLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(backendDir, 'dist')),
      environment: {
        ENV: process.env.ENV ?? 'production',
        TABLE_NAME: articlesTable.tableName,
        FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
        QIITA_API_URL: process.env.QIITA_API_URL ?? 'https://qiita.com/api/v2/items',
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

    //あとでEvent-Bridgeのバッチ処理を追加(API gatewayのfetchQiitaを定期実行)
  }
}
