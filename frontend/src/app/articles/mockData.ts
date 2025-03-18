import { Article } from '../../../types/Article';

export const mockArticles: Article[] = [
    {
        id: '1',
        title: 'AWS Lambdaの実践的な使い方と最適化テクニック',
        url: 'https://example.com/aws-lambda-optimization',
        tags: ['AWS', 'Lambda', 'サーバーレス', '最適化'],
        source: 'AWS公式ブログ',
        createdAt: '2023-12-01'
    },
    {
        id: '2',
        title: 'Next.js 14の新機能とパフォーマンス改善点',
        url: 'https://example.com/nextjs-14-features',
        tags: ['Next.js', 'React', 'フロントエンド', 'パフォーマンス'],
        source: 'Vercelブログ',
        createdAt: '2023-11-15'
    },
    {
        id: '3',
        title: 'DynamoDBでのデータモデリングベストプラクティス',
        url: 'https://example.com/dynamodb-data-modeling',
        tags: ['DynamoDB', 'AWS', 'NoSQL', 'データモデリング'],
        source: 'Tech Company Blog',
        createdAt: '2023-10-22'
    },
    {
        id: '4',
        title: 'TypeScriptの高度な型システムを活用したコード設計',
        url: 'https://example.com/typescript-advanced-types',
        tags: ['TypeScript', '型システム', 'コード設計'],
        source: 'TypeScript Magazine',
        createdAt: '2023-09-30'
    },
    {
        id: '5',
        title: 'Honoフレームワークでマイクロサービスを構築する方法',
        url: 'https://example.com/hono-microservices',
        tags: ['Hono', 'マイクロサービス', 'API', 'サーバーレス'],
        source: 'Dev.to',
        createdAt: '2023-08-15'
    },
    {
        id: '6',
        title: 'CloudFrontとS3を使った効率的な静的サイトホスティング',
        url: 'https://example.com/cloudfront-s3-hosting',
        tags: ['CloudFront', 'S3', 'AWS', 'ホスティング', 'CDN'],
        source: 'AWS Architecture Blog',
        createdAt: '2023-07-20'
    }
]; 