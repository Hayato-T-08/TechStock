import { ReturnValue } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { docClient, TABLE_NAME } from '../../db/client';

const ArticleSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  url: z.string(),
  tags: z.array(z.string()),
  source: z.string(),
  createdAt: z.string(),
  // 小文字変換用の追加フィールド（オプション）
  lower_case_title: z.string().optional(),
  lower_case_tags: z.array(z.string()).optional(),
});

// 更新用スキーマ - idフィールドを除外し、すべてのフィールドをオプションに
const ArticleUpdateSchema = ArticleSchema.partial().omit({ id: true });

// 記事作成用スキーマ - idとcreatedAtをオプションにする
const ArticleCreateSchema = ArticleSchema.omit({ id: true, createdAt: true });

const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

// 文字列を小文字に変換する関数
const toLowerCaseArray = (arr: string[]): string[] => {
  return arr.map((item) => item.toLowerCase());
};

const articles = new Hono()
  // 記事検索エンドポイント - タイトルやタグでの部分一致検索
  .get('/search', async (c) => {
    const titleQuery = c.req.query('title') || '';
    const tagQuery = c.req.query('tag') || '';

    // スキャンパラメータを設定
    const params: {
      TableName: string;
      FilterExpression?: string;
      ExpressionAttributeNames?: { [key: string]: string };
      ExpressionAttributeValues?: { [key: string]: unknown };
    } = {
      TableName: TABLE_NAME,
    };

    // フィルタ式の構築
    const filterExpressions: string[] = [];
    const expressionAttributeNames: { [key: string]: string } = {};
    const expressionAttributeValues: { [key: string]: unknown } = {};

    if (titleQuery) {
      // 大文字小文字を区別しないタイトル検索（lower_case_titleを使用）
      filterExpressions.push('begins_with(#lower_case_title, :lower_case_title)');
      expressionAttributeNames['#lower_case_title'] = 'lower_case_title';
      expressionAttributeValues[':lower_case_title'] = titleQuery.toLowerCase();
    }

    // タグ検索条件を追加（小文字変換したタグで検索）
    if (tagQuery) {
      filterExpressions.push('contains(#lower_case_tags, :lower_case_tag)');
      expressionAttributeNames['#lower_case_tags'] = 'lower_case_tags';
      expressionAttributeValues[':lower_case_tag'] = tagQuery.toLowerCase();
    }

    // フィルタ式が存在する場合のみ追加
    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
      params.ExpressionAttributeNames = expressionAttributeNames;
      params.ExpressionAttributeValues = expressionAttributeValues;
    }

    try {
      const response = await docClient.send(new ScanCommand(params));

      // 完全な部分一致検索を実装するためのフィルタリング
      // lower_case_titleフィールドを使っているので、すでに大文字小文字を区別しない検索になっている
      let results = response.Items || [];

      if (titleQuery && results.length > 0) {
        results = results.filter((item) =>
          item.lower_case_title.includes(titleQuery.toLowerCase())
        );
      }

      return c.json(results);
    } catch (err) {
      console.error('Error searching articles:', err);
      return c.json({ error: 'Failed to search articles' }, 500);
    }
  })
  // 全記事取得
  .get('/', async (c) => {
    try {
      const response = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
        })
      );
      return c.json(response.Items || []);
    } catch (err) {
      console.error('Error fetching all articles:', err);
      return c.json({ error: 'Failed to fetch articles' }, 500);
    }
  })
  // 記事の詳細取得
  .get('/:id', async (c) => {
    const { id } = c.req.param();

    const params = {
      TableName: TABLE_NAME,
      Key: { id },
    };

    try {
      const response = await docClient.send(new GetCommand(params));

      if (!response.Item) {
        console.log(`記事が見つかりません: ID=${id}`);
        return c.json({ error: 'Article not found', id }, 404);
      }

      return c.json(response.Item);
    } catch (err) {
      console.error('記事取得エラー:', err);
      // エラーの詳細情報を返す
      if (err instanceof Error) {
        return c.json(
          {
            error: 'Failed to fetch article',
            message: err.message,
            name: err.name,
            stack: err.stack,
          },
          500
        );
      }
      return c.json({ error: 'Failed to fetch article', details: String(err) }, 500);
    }
  })
  // 記事の作成
  .post('/', zValidator('json', ArticleCreateSchema), async (c) => {
    const article = c.req.valid('json');
    const timestamp = getCurrentTimestamp();

    const newArticle = {
      ...article,
      id: uuidv4(), // 常に新しいIDを生成
      createdAt: timestamp,
      updatedAt: timestamp,
      // 小文字変換フィールドを追加
      lower_case_title: article.title.toLowerCase(),
      lower_case_tags: toLowerCaseArray(article.tags),
    };

    const params = {
      TableName: TABLE_NAME,
      Item: newArticle,
    };

    try {
      await docClient.send(new PutCommand(params));
      return c.json(newArticle, 201);
    } catch (err) {
      console.error('Error creating article:', err);
      return c.json({ error: 'Failed to create article' }, 500);
    }
  })
  // 記事の更新
  .put('/:id', zValidator('json', ArticleUpdateSchema), async (c) => {
    const { id } = c.req.param();
    const article = c.req.valid('json');
    const updatedAt = getCurrentTimestamp();

    // 更新式を構築
    let updateExpression = 'SET ';
    const expressionAttributeNames: { [key: string]: string } = {};
    const expressionAttributeValues: { [key: string]: unknown } = {
      ':updatedAt': updatedAt,
    };

    // 更新フィールドの処理
    const updateFields = [];

    if (article.title !== undefined) {
      updateFields.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = article.title;

      // 小文字タイトルも更新
      updateFields.push('#lower_case_title = :lower_case_title');
      expressionAttributeNames['#lower_case_title'] = 'lower_case_title';
      expressionAttributeValues[':lower_case_title'] = article.title.toLowerCase();
    }

    if (article.url !== undefined) {
      updateFields.push('#url = :url');
      expressionAttributeNames['#url'] = 'url';
      expressionAttributeValues[':url'] = article.url;
    }

    if (article.tags !== undefined) {
      updateFields.push('#tags = :tags');
      expressionAttributeNames['#tags'] = 'tags';
      expressionAttributeValues[':tags'] = article.tags;

      // 小文字タグも更新
      updateFields.push('#lower_case_tags = :lower_case_tags');
      expressionAttributeNames['#lower_case_tags'] = 'lower_case_tags';
      expressionAttributeValues[':lower_case_tags'] = toLowerCaseArray(article.tags);
    }

    if (article.source !== undefined) {
      updateFields.push('#source = :source');
      expressionAttributeNames['#source'] = 'source';
      expressionAttributeValues[':source'] = article.source;
    }

    // 更新日時を追加
    updateFields.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';

    // 更新するフィールドがない場合
    if (updateFields.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updateExpression += updateFields.join(', ');

    const params = {
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: ReturnValue.ALL_NEW,
    };

    try {
      // 記事が存在するか確認
      const getParams = {
        TableName: TABLE_NAME,
        Key: { id },
      };

      const existingItem = await docClient.send(new GetCommand(getParams));

      if (!existingItem.Item) {
        return c.json({ error: 'Article not found' }, 404);
      }

      // 更新を実行
      const response = await docClient.send(new UpdateCommand(params));
      return c.json(response.Attributes);
    } catch (err) {
      console.error('Error updating article:', err);
      return c.json({ error: 'Failed to update article' }, 500);
    }
  })
  // 記事の削除
  .delete('/:id', async (c) => {
    const { id } = c.req.param();

    const params = {
      TableName: TABLE_NAME,
      Key: { id },
      ReturnValues: ReturnValue.ALL_OLD,
    };

    try {
      // 記事が存在するか確認
      const getParams = {
        TableName: TABLE_NAME,
        Key: { id },
      };

      const existingItem = await docClient.send(new GetCommand(getParams));

      if (!existingItem.Item) {
        return c.json({ error: 'Article not found' }, 404);
      }

      // 削除を実行
      const response = await docClient.send(new DeleteCommand(params));
      return c.json({
        message: 'Article deleted successfully',
        deletedArticle: response.Attributes,
      });
    } catch (err) {
      console.error('Error deleting article:', err);
      return c.json({ error: 'Failed to delete article' }, 500);
    }
  });

export default articles;
