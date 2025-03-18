'use client';

import { useState } from 'react';
import { mockArticles } from './mockData';

export default function ArticleList() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredArticles = mockArticles.filter(
        (article) =>
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.tags.some((tag) =>
                tag.toLowerCase().includes(searchQuery.toLowerCase())
            )
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6">技術記事一覧</h1>

            <div className="relative mb-8">
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
                    placeholder="記事タイトルやタグで検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                {filteredArticles.length > 0 ? (
                    filteredArticles.map((article) => (
                        <div
                            key={article.id}
                            className="p-5 bg-white rounded-md shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
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
                                <span className="text-sm text-gray-500">
                                    {formatDate(article.createdAt)}
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 mb-3">
                                出典: {article.source}
                            </p>

                            <div className="flex flex-wrap">
                                {article.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="m-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
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
        </div>
    );
}
