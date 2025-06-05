import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bedrock',
  description: 'Notion clone built with Next.js and Supabase',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">

      <body className={`${inter.className} bg-white text-black dark:bg-gray-900 dark:text-white`}>
        <div className="p-4">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}
