'use client';

import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import Layout from './Layout';

const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'sm',
  components: {
    AppShell: {
      styles: {
        main: { background: '#f8f9fa' }
      }
    }
  },
  fontFamily: 'Inter, sans-serif'
});

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <Layout>{children}</Layout>
    </MantineProvider>
  );
} 