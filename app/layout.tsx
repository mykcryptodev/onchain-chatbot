import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { League_Spartan, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { default as ThirdwebProviderComponent } from '@/providers/Thirdweb';
import { FarcasterProvider } from '@/components/farcaster-provider';

export const metadata: Metadata = {
  metadataBase: new URL('https://chat.vercel.ai'),
  title: 'Onchain Chatbot - AI Assistant for Web3',
  description:
    'An intelligent AI chatbot for blockchain interactions, token swaps, and onchain operations.',
  openGraph: {
    title: 'Onchain Chatbot - AI Assistant for Web3',
    description:
      'An intelligent AI chatbot for blockchain interactions, token swaps, and onchain operations.',
    url: 'https://chat.vercel.ai',
    siteName: 'Onchain Chatbot',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Onchain Chatbot - AI Assistant for Web3',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Onchain Chatbot - AI Assistant for Web3',
    description:
      'An intelligent AI chatbot for blockchain interactions, token swaps, and onchain operations.',
    images: ['/opengraph-image.png'],
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: '1',
      imageUrl: 'https://chat.vercel.ai/opengraph-image.png',
      button: {
        title: '🤖 Start Chat',
        action: {
          type: 'launch_frame',
          name: 'Onchain Chatbot',
          url: 'https://onchain-chatbot.vercel.app',
        },
      },
    }),
  },
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-league-spartan',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
      className={`${leagueSpartan.variable} ${geistMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="top-center" />
          <SessionProvider>
            <ThirdwebProviderComponent>
              <FarcasterProvider>{children}</FarcasterProvider>
            </ThirdwebProviderComponent>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
