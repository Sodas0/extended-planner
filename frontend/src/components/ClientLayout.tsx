'use client';

import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import Layout from './Layout';

const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
  components: {
    AppShell: {
      styles: {
        main: { 
          background: 'var(--mantine-color-gray-0)'
        }
      }
    },
    Paper: {
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
        withBorder: true
      }
    },
    Button: {
      defaultProps: {
        size: 'sm'
      },
      styles: {
        root: {
          fontWeight: 600
        }
      }
    },
    ActionIcon: {
      defaultProps: {
        variant: 'light'
      }
    },
    Text: {
      styles: {
        root: {
          color: 'var(--mantine-color-dark-9)',
          '&[dataChecked="true"]': {
            textDecoration: 'line-through',
            color: 'var(--mantine-color-gray-7)'
          }
        }
      }
    },
    Checkbox: {
      styles: {
        label: {
          color: 'var(--mantine-color-dark-9)'
        }
      }
    },
    Title: {
      styles: {
        root: {
          color: 'var(--mantine-color-dark-9)'
        }
      }
    },
    NavLink: {
      styles: {
        root: {
          color: 'var(--mantine-color-dark-9)',
          '&[data-active]': {
            color: 'var(--mantine-color-blue-7)'
          }
        }
      }
    },
    Stack: {
      styles: {
        root: {
          color: 'var(--mantine-color-dark-9)'
        }
      }
    }
  },
  colors: {
    // Custom blue palette
    blue: [
      '#E6F3FF',
      '#CCE7FF',
      '#99CEFF',
      '#66B5FF',
      '#339CFF',
      '#0083FF',
      '#0066CC',
      '#004C99',
      '#003366',
      '#001933',
    ],
  },
  fontFamily: 'Inter, sans-serif',
  white: '#FFFFFF',
  black: '#1A1B1E',
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