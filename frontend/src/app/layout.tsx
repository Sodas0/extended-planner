import '@mantine/core/styles.css';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Inter } from 'next/font/google';
import Layout from '@/components/Layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Extended Planner',
  description: 'Personal planning and effective goal tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body className={inter.className}>
        <MantineProvider>
          <Layout>{children}</Layout>
        </MantineProvider>
      </body>
    </html>
  );
}
