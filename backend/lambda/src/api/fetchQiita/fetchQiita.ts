import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import 'dotenv/config';
import { Hono } from 'hono';
import { docClient, TABLE_NAME } from '../../db/client';
import { Article } from '../../types/Article';
import { QiitaArticle } from '../../types/QiitaArticle';

// 簡略化されたQiitaのデータ型
interface SimplifiedQiitaArticle {
  id: string;
  title: string;
  url: string;
  tags: Array<{ name: string }>;
}

// Qiita記事を取得する関数（EventBridge用）
export const fetchQiitaArticles = async () => {
  const user_id = process.env.QIITA_USER_ID;
  const baseUrl = process.env.QIITA_API_URL + '/users/' + user_id + '/stocks';
  const perPage = 20; // ページサイズを小さくして一度に処理するデータ量を削減
  let page = 1;
  let allData: SimplifiedQiitaArticle[] = [];
  let hasMoreData = true;

  // 最大ページ数を制限して処理時間を短縮（20件×5ページ=100件まで取得可能）
  const MAX_PAGES = 5;

  try {
    // ページングを使用して記事を取得
    while (hasMoreData && page <= MAX_PAGES) {
      const url = `${baseUrl}?page=${page}&per_page=${perPage}`;
      console.log(`${page}ページ目を取得: ${url}`);

      // タイムアウトを設定
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        // レスポンスヘッダー情報を取得
        const rateLimit = response.headers.get('Rate-Limit');
        const rateLimitRemaining = response.headers.get('Rate-Limit-Remaining');
        console.log(`Rate Limit: ${rateLimit}, Remaining: ${rateLimitRemaining}`);

        const data = (await response.json()) as QiitaArticle[];

        if (Array.isArray(data) && data.length > 0) {
          // メモリ使用量削減のため、必要な情報だけを抽出して保存
          const simplifiedData = data.map(
            (item: QiitaArticle): SimplifiedQiitaArticle => ({
              id: item.id,
              title: item.title,
              url: item.url,
              tags: item.tags,
            })
          );

          allData = [...allData, ...simplifiedData];

          if (data.length < perPage) {
            hasMoreData = false;
          } else {
            page++;
          }
        } else {
          hasMoreData = false;
        }

        // レート制限チェック
        if (rateLimitRemaining && parseInt(rateLimitRemaining) < 10) {
          hasMoreData = false;
        }
      } catch (error) {
        console.error(`APIリクエストエラー: ${error}`);
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('APIリクエストがタイムアウトしました');
        }
        page++;
        clearTimeout(timeoutId);
      }

      // GCを促進
      if (typeof global.gc === 'function') {
        global.gc();
      }
    }

    console.log(`合計${allData.length}件の記事を取得しました`);

    // 最小限の情報だけをマッピング
    const articles: Article[] = allData.map((qiitaArticle: SimplifiedQiitaArticle) => ({
      id: qiitaArticle.id,
      title: qiitaArticle.title,
      url: qiitaArticle.url,
      tags: qiitaArticle.tags.map((tag) => tag.name),
      source: 'Qiita',
    }));

    // 不要なデータの参照を削除
    allData = [];

    // GCを促進
    if (typeof global.gc === 'function') {
      global.gc();
    }

    // 既存の記事IDを取得
    const existingArticlesResponse = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        ProjectionExpression: 'id',
      })
    );
    const existingArticles = existingArticlesResponse.Items || [];
    const existingArticleIds = new Set(existingArticles.map((article) => article.id));

    // 新規記事をフィルタリング
    const newArticles = articles.filter((article) => !existingArticleIds.has(article.id));
    console.log(`取得記事: ${articles.length}件, 新規記事: ${newArticles.length}件`);

    // バッチ処理の設定
    const timestamp = new Date().toISOString();
    const BATCH_SIZE = 5; // バッチサイズを小さく設定

    // 処理状況の追跡
    let savedCount = 0;
    let processedCount = 0;

    // 保存処理
    for (let i = 0; i < newArticles.length; i += BATCH_SIZE) {
      const batch = newArticles.slice(i, i + BATCH_SIZE);
      console.log(
        `バッチ処理開始: ${processedCount + 1}〜${processedCount + batch.length}/${newArticles.length}件`
      );

      // バッチ処理
      const promises = batch.map(async (article) => {
        const newItem = {
          id: article.id,
          title: article.title,
          url: article.url,
          tags: article.tags,
          source: 'Qiita',
          createdAt: timestamp,
          updatedAt: timestamp,
          lower_case_title: article.title.toLowerCase(),
          lower_case_tags: article.tags.map((tag) => tag.toLowerCase()),
        };

        await docClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: newItem,
          })
        );
        console.log(`記事を保存: ${article.title.substring(0, 30)}...`);
        return true;
      });

      // 各バッチを逐次処理
      const results = await Promise.all(promises);
      savedCount += results.filter(Boolean).length;
      processedCount += batch.length;

      console.log(
        `バッチ処理完了: ${batch.length}件保存, 合計${savedCount}/${newArticles.length}件完了`
      );

      // バッチ間で少し待機して負荷を分散
      if (i + BATCH_SIZE < newArticles.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // GCを促進
      if (typeof global.gc === 'function') {
        global.gc();
      }
    }

    return {
      total: articles.length,
      new: newArticles.length,
      saved: savedCount,
    };
  } catch (err) {
    console.error('処理エラー:', err);
    throw err;
  }
};

// API Gateway用のHonoルーター
const fetchQiita = new Hono().post('/', async (c) => {
  try {
    const result = await fetchQiitaArticles();
    return c.json(result);
  } catch (err) {
    console.error('処理エラー:', err);
    return c.json(
      {
        error: 'Failed to process articles',
        message: err instanceof Error ? err.message : String(err),
      },
      500
    );
  }
});

export default fetchQiita;
