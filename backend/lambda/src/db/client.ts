import {
  CreateTableCommand,
  DynamoDBClient,
  KeyType,
  ListTablesCommand,
  ProjectionType,
  ScalarAttributeType,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import process from 'process';

// ローカルにアクセスするためだけのダミーアクセスキーを設定。
// 何も権限情報も存在しない。
const devConfig = {
  endpoint: 'http://localhost:8000',
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: 'fakeaccesskey',
    secretAccessKey: 'fakesecretaccesskey',
  },
};

const client = new DynamoDBClient(process.env.ENV === 'development' ? devConfig : {});

// マーシャリング設定を追加して、StringSetをサポート
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Articlesテーブルを作成する関数
const createArticlesTable = async () => {
  console.log('Articlesテーブル作成を開始...');
  const params = {
    TableName: 'Articles',
    KeySchema: [{ AttributeName: 'id', KeyType: KeyType.HASH }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: ScalarAttributeType.S },
      { AttributeName: 'title', AttributeType: ScalarAttributeType.S },
      // タイトル検索のための属性定義
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
    GlobalSecondaryIndexes: [
      {
        IndexName: 'TitleIndex', //タイトルで検索するためのGSI
        KeySchema: [{ AttributeName: 'title', KeyType: KeyType.HASH }],
        Projection: { ProjectionType: ProjectionType.ALL },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
  };

  try {
    console.log('DynamoDBにテーブル作成コマンドを送信...');
    const result = await client.send(new CreateTableCommand(params));
    console.log('Articles table created successfully with indexes', result);
    return true;
  } catch (err) {
    // ResourceInUseExceptionはテーブルが既に存在することを意味するため、エラーとして扱わない
    if (err && typeof err === 'object' && 'name' in err && err.name === 'ResourceInUseException') {
      console.log('テーブルはすでに存在します。再利用します。');
      return true;
    }
    console.error('テーブル作成エラー:', err);
    return false;
  }
};

// ローカルデータベース内にテーブル作成
const initializeDynamoDB = async () => {
  if (process.env.ENV === 'development') {
    try {
      console.log('DynamoDBテーブルの初期化を開始します...');
      const { TableNames } = await client.send(new ListTablesCommand({}));
      console.log('既存のテーブル:', TableNames);

      // Articlesテーブルの確認と作成
      if (TableNames && !TableNames.includes('Articles')) {
        console.log('Articlesテーブルが存在しないため作成します');
        await createArticlesTable();
      } else if (TableNames && TableNames.includes('Articles')) {
        console.log('Articlesテーブルは既に存在します');
      } else {
        console.log('テーブル一覧の取得に失敗、Articlesテーブルを作成します');
        await createArticlesTable();
      }
    } catch (err) {
      console.error('DynamoDB初期化エラー:', err);
    }
  } else {
    console.log('開発環境以外ではテーブル自動作成をスキップします。環境:', process.env.ENV);
  }
};

// テーブル初期化を実行
initializeDynamoDB();

const TABLE_NAME = 'Articles';
const TITLE_INDEX = 'TitleIndex';

export { docClient, TABLE_NAME, TITLE_INDEX };

// タグはStringSet型で保存する
