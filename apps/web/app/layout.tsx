import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ApolloProviderWrapper } from './ApolloProviderWrapper';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import AuthProvider from './AuthProvider'; // <-- 1. IMPORT the AuthProvider
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NODA Systems Dashboard',
  description: 'System monitoring and analytics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* 2. WRAP everything with AuthProvider */}
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ApolloProviderWrapper>{children}</ApolloProviderWrapper>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}