/**
 * APIサービスクラス
 * バックエンドAPIとの通信を担当
 */
import { Article } from '../../types/Article';

// Honoサーバーのデフォルトポートは5555
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555';

// 共通のフェッチオプション
const fetchOptions: RequestInit = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
};

// 全記事取得
export async function fetchArticles(): Promise<Article[]> {
  try {
    const response = await fetch(`${API_URL}/api/articles`, fetchOptions);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('記事の取得に失敗しました:', error);
    return [];
  }
}

// 記事詳細取得
export async function fetchArticleById(id: string): Promise<Article | null> {
  try {
    const response = await fetch(`${API_URL}/api/articles/${id}`, fetchOptions);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`ID: ${id}の記事取得に失敗しました:`, error);
    return null;
  }
}

// 記事検索
export async function searchArticles(params: { title?: string; tag?: string }): Promise<Article[]> {
  try {
    const queryParams = new URLSearchParams();

    if (params.title) {
      queryParams.append('title', params.title);
    }

    if (params.tag) {
      queryParams.append('tag', params.tag);
    }

    const url = `${API_URL}/api/articles/search?${queryParams.toString()}`;
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('記事の検索に失敗しました:', error);
    return [];
  }
}

// 記事作成
export async function createArticle(
  article: Omit<Article, 'id' | 'createdAt'>
): Promise<Article | null> {
  try {
    const response = await fetch(`${API_URL}/api/articles`, {
      ...fetchOptions,
      method: 'POST',
      body: JSON.stringify({
        ...article,
        id: crypto.randomUUID(), // クライアント側でUUIDを生成
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('記事の作成に失敗しました:', error);
    return null;
  }
}

// 記事更新
export async function updateArticle(
  id: string,
  article: Partial<Omit<Article, 'id' | 'createdAt'>>
): Promise<Article | null> {
  try {
    const response = await fetch(`${API_URL}/api/articles/${id}`, {
      ...fetchOptions,
      method: 'PUT',
      body: JSON.stringify(article),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`ID: ${id}の記事更新に失敗しました:`, error);
    return null;
  }
}

// 記事削除
export async function deleteArticle(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/articles/${id}`, {
      ...fetchOptions,
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error(`ID: ${id}の記事削除に失敗しました:`, error);
    return false;
  }
}
