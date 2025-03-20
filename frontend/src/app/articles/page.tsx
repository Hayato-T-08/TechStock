'use client';

import { useEffect, useMemo, useState } from 'react';
import { Article } from '../../../types/Article';
import {
  createArticle,
  deleteArticle,
  fetchArticles,
  searchArticles,
  updateArticle,
} from '../../services/api';
import { mockArticles } from './mockData';

export default function ArticleList() {
  const [titleQuery, setTitleQuery] = useState('');
  const [tagQuery, setTagQuery] = useState('');
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Partial<Article>>({
    title: '',
    url: '',
    tags: [],
    source: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // ページネーション用の状態
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage] = useState(5);

  // APIからデータを読み込む
  useEffect(() => {
    const loadArticles = async () => {
      setIsLoading(true);
      try {
        const articlesData = await fetchArticles();
        setAllArticles(articlesData);
        setSearchResults(articlesData);
      } catch (error) {
        console.error('記事の取得に失敗しました:', error);
        // APIからの取得に失敗した場合はモックデータを使用
        setAllArticles(mockArticles);
        setSearchResults(mockArticles);
      } finally {
        setIsLoading(false);
      }
    };

    loadArticles();
  }, []);

  // タイトル検索ハンドラー
  const handleTitleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleQuery(e.target.value);
  };

  // タグ検索ハンドラー
  const handleTagQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagQuery(e.target.value);
  };

  // API検索（デバウンス付き）
  useEffect(() => {
    const searchFromAPI = async () => {
      // 検索クエリが両方とも空の場合は全記事を表示
      if (!titleQuery.trim() && !tagQuery.trim()) {
        setSearchResults(allArticles);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchArticles({
          title: titleQuery.trim() || undefined,
          tag: tagQuery.trim() || undefined,
        });
        setSearchResults(results);
      } catch (error) {
        console.error('記事の検索に失敗しました:', error);
      } finally {
        setIsSearching(false);
      }
    };

    // APIデバウンスの時間を長めに設定（ユーザーが入力を完了した可能性が高いタイミング）
    const debounceTimeout = setTimeout(() => {
      searchFromAPI();
    }, 800); // 800ms

    return () => clearTimeout(debounceTimeout);
  }, [titleQuery, tagQuery, allArticles]);

  // 検索クエリが変更されたらページをリセット
  useEffect(() => {
    setCurrentPage(1);
  }, [titleQuery, tagQuery]);

  // 現在のページの記事を取得
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = useMemo(() => {
    return searchResults.slice(indexOfFirstArticle, indexOfLastArticle);
  }, [searchResults, indexOfFirstArticle, indexOfLastArticle]);

  // 総ページ数を計算
  const totalPages = Math.ceil(searchResults.length / articlesPerPage);

  // ページネーションナビゲーションの生成
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center mt-6">
        <nav className="inline-flex rounded-md shadow">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-l-md ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
          >
            &lt;
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => setCurrentPage(1)}
                className="px-3 py-1 bg-white text-gray-700 hover:bg-gray-50 border-t border-b border-gray-300"
              >
                1
              </button>
              {startPage > 2 && (
                <span className="px-3 py-1 bg-white text-gray-700 border-t border-b border-gray-300">
                  ...
                </span>
              )}
            </>
          )}

          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={`px-3 py-1 ${
                currentPage === number
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-gray-300`}
            >
              {number}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="px-3 py-1 bg-white text-gray-700 border-t border-b border-gray-300">
                  ...
                </span>
              )}
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="px-3 py-1 bg-white text-gray-700 hover:bg-gray-50 border-t border-b border-gray-300"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-r-md ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
          >
            &gt;
          </button>
        </nav>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('この記事を削除してもよろしいですか？')) {
      try {
        const success = await deleteArticle(id);
        if (success) {
          const updatedArticles = allArticles.filter((article) => article.id !== id);
          setAllArticles(updatedArticles);

          // 検索クエリが空の場合は全記事を表示、そうでなければ再検索
          if (!titleQuery.trim() && !tagQuery.trim()) {
            setSearchResults(updatedArticles);
          } else {
            const results = await searchArticles({
              title: titleQuery.trim() || undefined,
              tag: tagQuery.trim() || undefined,
            });
            setSearchResults(results);
          }

          // 現在のページの記事がすべて削除された場合、前のページに戻る
          if (currentArticles.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
        }
      } catch (error) {
        console.error('記事の削除に失敗しました:', error);
        alert('記事の削除に失敗しました');
      }
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle({ ...article });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !editingArticle.tags?.includes(tagInput.trim())) {
      setEditingArticle({
        ...editingArticle,
        tags: [...(editingArticle.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditingArticle({
      ...editingArticle,
      tags: editingArticle.tags?.filter((t) => t !== tag),
    });
  };

  const handleAddNew = () => {
    setEditingArticle({
      title: '',
      url: '',
      tags: [],
      source: '',
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleClearSearch = () => {
    setTitleQuery('');
    setTagQuery('');
    setSearchResults(allArticles);
  };

  const handleSubmit = async () => {
    if (!editingArticle.title || !editingArticle.url) {
      alert('タイトルとURLは必須です');
      return;
    }

    try {
      if (isEditing) {
        // 更新
        const updatedArticle = await updateArticle(editingArticle.id as string, {
          title: editingArticle.title,
          url: editingArticle.url,
          tags: editingArticle.tags || [],
          source: editingArticle.source || '',
        });

        if (updatedArticle) {
          const updatedArticles = allArticles.map((article) =>
            article.id === editingArticle.id ? updatedArticle : article
          );
          setAllArticles(updatedArticles);

          // 検索クエリが空の場合は全記事を表示、そうでなければ再検索
          if (!titleQuery.trim() && !tagQuery.trim()) {
            setSearchResults(updatedArticles);
          } else {
            const results = await searchArticles({
              title: titleQuery.trim() || undefined,
              tag: tagQuery.trim() || undefined,
            });
            setSearchResults(results);
          }
        }
      } else {
        // 新規作成
        const newArticle = await createArticle({
          title: editingArticle.title,
          url: editingArticle.url,
          tags: editingArticle.tags || [],
          source: editingArticle.source || '',
        });

        if (newArticle) {
          const updatedArticles = [...allArticles, newArticle];
          setAllArticles(updatedArticles);

          // 検索クエリが空の場合は全記事を表示、そうでなければ再検索
          if (!titleQuery.trim() && !tagQuery.trim()) {
            setSearchResults(updatedArticles);
          } else {
            const results = await searchArticles({
              title: titleQuery.trim() || undefined,
              tag: tagQuery.trim() || undefined,
            });
            setSearchResults(results);
          }
        }
      }

      setShowModal(false);
    } catch (error) {
      console.error('記事の保存に失敗しました:', error);
      alert('記事の保存に失敗しました');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">技術記事一覧</h1>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          記事を追加
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="タイトルで検索..."
            value={titleQuery}
            onChange={handleTitleQueryChange}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="タグで検索..."
            value={tagQuery}
            onChange={handleTagQueryChange}
          />
        </div>

        {(titleQuery || tagQuery) && (
          <div className="flex justify-end">
            <button
              onClick={handleClearSearch}
              className="text-gray-500 hover:text-gray-700 flex items-center"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              検索をクリア
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 text-sm text-gray-500">
        {searchResults.length > 0 && (
          <p>
            全{searchResults.length}件中 {indexOfFirstArticle + 1}〜
            {Math.min(indexOfLastArticle, searchResults.length)}
            件を表示
            {isSearching && (
              <span className="ml-2 inline-block">
                <span className="animate-pulse">検索中...</span>
              </span>
            )}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {currentArticles.length > 0 ? (
          currentArticles.map((article) => (
            <div
              key={article.id}
              className="p-5 bg-white rounded-md shadow-md hover:shadow-lg transition-all duration-200"
            >
              <div className="flex justify-between items-center mb-2">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-lg text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {article.title}
                  <svg
                    className="inline-block ml-1 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                </a>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-3">
                    {formatDate(article.createdAt)}
                  </span>
                  <button
                    onClick={() => handleEdit(article)}
                    className="text-blue-500 hover:text-blue-700 mr-2"
                    aria-label="記事を編集"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="記事を削除"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">出典: {article.source}</p>

              <div className="flex flex-wrap">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="m-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded cursor-pointer hover:bg-gray-200"
                    onClick={() => setTagQuery(tag)}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <p>検索条件に一致する記事が見つかりませんでした。</p>
          </div>
        )}
      </div>

      {/* ページネーション */}
      {renderPagination()}

      {/* 記事追加・編集モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{isEditing ? '記事を編集' : '記事を追加'}</h2>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                タイトル *
              </label>
              <input
                id="title"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={editingArticle.title}
                onChange={(e) =>
                  setEditingArticle({
                    ...editingArticle,
                    title: e.target.value,
                  })
                }
                placeholder="記事のタイトル"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="url">
                URL *
              </label>
              <input
                id="url"
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={editingArticle.url}
                onChange={(e) =>
                  setEditingArticle({
                    ...editingArticle,
                    url: e.target.value,
                  })
                }
                placeholder="https://example.com"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="source">
                出典
              </label>
              <input
                id="source"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={editingArticle.source}
                onChange={(e) =>
                  setEditingArticle({
                    ...editingArticle,
                    source: e.target.value,
                  })
                }
                placeholder="記事の出典"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tags">
                タグ
              </label>
              <div className="flex">
                <input
                  id="tags"
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="タグを入力"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-gray-200 text-gray-700 px-3 py-2 rounded-r-md hover:bg-gray-300"
                >
                  追加
                </button>
              </div>
              <div className="flex flex-wrap mt-2">
                {editingArticle.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="m-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded flex items-center"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {isEditing ? '更新' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
