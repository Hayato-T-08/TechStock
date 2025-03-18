# TechStock

技術在庫管理システム

## プロジェクト構成

-   **フロントエンド**: Next.js (SSG) - CloudFront + S3 にデプロイ
-   **バックエンド**: Hono + AWS Lambda + API Gateway + DynamoDB
-   **インフラストラクチャ**: AWS CDK

## ディレクトリ構造

```
TechStock/
├── frontend/        # Next.jsプロジェクト
├── backend/         # Honoアプリケーション
└── infrastructure/  # AWS CDKコード
```

## 開発方法

### 前提条件

-   Node.js 18 以上
-   AWS CLI のセットアップとプロファイル設定
-   AWS CDK のインストール

### セットアップ手順

1. リポジトリのクローン:

    ```bash
    git clone https://github.com/yourusername/TechStock.git
    cd TechStock
    ```

2. フロントエンド開発:

    ```bash
    cd frontend
    npm install
    npm run dev
    ```

3. バックエンド開発:

    ```bash
    cd backend
    npm install
    npm run dev
    ```

4. インフラストラクチャのデプロイ:
    ```bash
    cd infrastructure
    npm install
    npm run cdk bootstrap
    npm run cdk deploy
    ```

## ライセンス

MIT
