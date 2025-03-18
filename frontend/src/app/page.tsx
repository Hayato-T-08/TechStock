'use client';

import Link from 'next/link';

export default function Home() {
    return (
        <div className="max-w-6xl mx-auto py-10 px-4">
            <div className="text-center py-10">
                <h1 className="text-4xl font-bold mb-4">TechStock</h1>
                <p className="text-xl mb-6">技術記事管理アプリ</p>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <Link
                        href="/articles"
                        className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-md font-medium shadow-sm hover:bg-blue-700 transition-colors"
                    >
                        <svg
                            className="w-5 h-5 mr-2"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                        記事一覧を見る
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
                <div className="p-5 shadow-md border border-gray-200 rounded-md">
                    <svg
                        className="w-10 h-10 text-blue-500 mb-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <h3 className="text-lg font-medium mb-2">記事管理</h3>
                    <p className="text-gray-600">
                        技術記事の効率的な保存と管理。必要な情報をいつでも簡単に見つけられます。
                    </p>
                </div>
                <div className="p-5 shadow-md border border-gray-200 rounded-md">
                    <svg
                        className="w-10 h-10 text-green-500 mb-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                        <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                        <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                    </svg>
                    <h3 className="text-lg font-medium mb-2">タグ付け</h3>
                    <p className="text-gray-600">
                        記事にタグを付けて整理。カテゴリ別に簡単に検索できます。
                    </p>
                </div>
                <div className="p-5 shadow-md border border-gray-200 rounded-md">
                    <svg
                        className="w-10 h-10 text-purple-500 mb-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <h3 className="text-lg font-medium mb-2">クラウド保存</h3>
                    <p className="text-gray-600">
                        AWSのクラウドサービスを利用した安全な保存。どこからでもアクセス可能です。
                    </p>
                </div>
            </div>
        </div>
    );
}
