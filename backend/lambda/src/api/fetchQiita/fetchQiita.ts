import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import 'dotenv/config';
import { Hono } from 'hono';
import { docClient, TABLE_NAME } from '../../db/client';
import { Article } from '../../types/Article';
import { QiitaArticle } from '../../types/QiitaArticle';

const fetchQiita = new Hono().post('/', async (c) => {
  const user_id = process.env.QIITA_USER_ID;
  const baseUrl = process.env.QIITA_API_URL + '/users/' + user_id + '/stocks';
  const perPage = 100; // QiitaのAPIは1ページ当たり最大100件
  let page = 1;
  let allData: QiitaArticle[] = [];
  let hasMoreData = true;

  // ページングを使用して全記事を取得
  while (hasMoreData) {
    const url = `${baseUrl}?page=${page}&per_page=${perPage}`;
    console.log(`${page}ページ目を取得: ${url}`);

    const response = await fetch(url);

    // レスポンスヘッダーからレート制限情報を取得
    const rateLimit = response.headers.get('Rate-Limit');
    const rateLimitRemaining = response.headers.get('Rate-Limit-Remaining');
    const rateLimitReset = response.headers.get('Rate-Limit-Reset');

    console.log(
      `Rate Limit: ${rateLimit}, Remaining: ${rateLimitRemaining}, Reset: ${rateLimitReset}`
    );

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      allData = [...allData, ...data];
      // 1ページあたりの最大数より少ない場合は次のページはない
      if (data.length < perPage) {
        hasMoreData = false;
      } else {
        page++;
      }
    } else {
      hasMoreData = false;
    }

    // レート制限に近づいている場合は一時停止
    if (rateLimitRemaining && parseInt(rateLimitRemaining) < 10) {
      console.log('レート制限に近づいているため、一時停止します');
      hasMoreData = false;
    }
  }

  console.log(`合計${allData.length}件の記事を取得しました`);

  const articles: Article[] = allData.map((qiitaArticle: QiitaArticle) => {
    return {
      id: qiitaArticle.id,
      title: qiitaArticle.title,
      url: qiitaArticle.url,
      tags: qiitaArticle.tags.map((tag) => tag.name),
      source: 'Qiita',
    };
  });

  // 1. DynamoDBから全記事を取得
  try {
    const existingArticlesResponse = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    );
    const existingArticles = existingArticlesResponse.Items || [];

    // 既存の記事IDのセットを作成
    const existingArticleIds = new Set(existingArticles.map((article) => article.id));

    // 2. Qiitaの記事のIDと同じIDの記事を除外
    const newArticles = articles.filter((article) => !existingArticleIds.has(article.id));

    console.log(`取得した記事: ${articles.length}件, 新規記事: ${newArticles.length}件`);

    // 3. フィルタリングされた記事をDynamoDBに書き込む
    const timestamp = new Date().toISOString();

    for (const article of newArticles) {
      const newItem = {
        ...article,
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
      console.log(`記事を保存しました: ${article.title}`);
    }

    return c.json({
      total: articles.length,
      new: newArticles.length,
      articles: newArticles,
    });
  } catch (err) {
    console.error('DynamoDBの操作中にエラーが発生しました:', err);
    return c.json({ error: 'Failed to process articles' }, 500);
  }
});

export default fetchQiita;
