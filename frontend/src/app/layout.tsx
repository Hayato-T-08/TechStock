import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'TechStock - 技術在庫管理システム',
    description: '技術記事のアーカイブとタグ付けのための管理システム',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
            >
                <header className="bg-white shadow-sm">
                    <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                        <Link
                            href="/"
                            className="text-xl font-bold text-blue-600"
                        >
                            TechStock
                        </Link>
                        <nav>
                            <ul className="flex space-x-6">
                                <li>
                                    <Link
                                        href="/"
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        ホーム
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/articles"
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        記事一覧
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </header>

                <main>{children}</main>

                <footer className="bg-white mt-12 py-6 border-t">
                    <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
                        © {new Date().getFullYear()} TechStock
                    </div>
                </footer>
            </body>
        </html>
    );
}
