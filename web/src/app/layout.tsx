import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from './providers';
import { ColorSwap } from '~components/color-swap';
import '~styles/globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Water Writing - Where Words Begin to Flow',
  description: 'Create, organize, and enhance your writing with AI assistance.',
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html
    lang='en'
    className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    suppressHydrationWarning
  >
    <body className='min-h-full flex flex-col'>
      <Providers>
        {children}
        <ColorSwap />
      </Providers>
    </body>
  </html>
);
export default RootLayout;
