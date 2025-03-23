import type { Context } from 'aws-lambda';
import type { LambdaEvent } from 'hono/aws-lambda';
import { handle } from 'hono/aws-lambda';
import { fetchQiitaArticles } from './src/api/fetchQiita/fetchQiita';
import app from './src/app';

// EventBridgeからのイベント型を定義
interface EventBridgeEvent {
  source: string;
  action: string;
  [key: string]: unknown;
}

export const handler = async (event: EventBridgeEvent | LambdaEvent, context: Context) => {
  // EventBridgeからのスケジュール実行の場合
  if ('source' in event && event.source === 'eventbridge' && event.action === 'fetchQiita') {
    console.log('EventBridgeからのスケジュール実行: fetchQiita');
    try {
      const result = await fetchQiitaArticles();
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Qiita記事を取得しました',
          data: result,
        }),
      };
    } catch (error) {
      console.error('Qiita記事取得エラー:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Qiita記事の取得に失敗しました',
        }),
      };
    }
  }

  // 通常のAPI Gateway経由のリクエスト
  return handle(app)(event as LambdaEvent, context);
};
