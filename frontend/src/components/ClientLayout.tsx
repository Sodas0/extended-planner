'use client';

import { MantineProvider, MantineThemeOverride, type MantineTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import Layout from './Layout';
import { useTheme } from '@/hooks/useTheme';
import { useMemo, useEffect } from 'react';

// Type for Mantine's color array (10 elements)
type MantineColorArray = [string, string, string, string, string, string, string, string, string, string];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { colorScheme, themeConfig, setColorScheme } = useTheme();
  
  // Load theme from localStorage on first render if available
  useEffect(() => {
    // We only do this once on initial client-side render
    // This helps ensure we have the right theme after hydration
    try {
      const themeData = localStorage.getItem('theme-storage');
      if (themeData) {
        const parsedData = JSON.parse(themeData);
        if (parsedData.state && parsedData.state.colorScheme) {
          // No need to set if it's already the same
          if (parsedData.state.colorScheme !== colorScheme) {
            setColorScheme(parsedData.state.colorScheme);
          }
        }
      }
    } catch (e) {
      console.error('Error checking theme from localStorage:', e);
    }
  }, []);
  
  // Create a theme configuration based on our centralized theme store
  const theme = useMemo(() => {
    // Create a properly typed color array for Mantine
    const primaryColors: MantineColorArray = [
      themeConfig.colors.primary[0] || '#E6F3FF',
      themeConfig.colors.primary[1] || '#CCE7FF',
      themeConfig.colors.primary[2] || '#99CEFF',
      themeConfig.colors.primary[3] || '#66B5FF',
      themeConfig.colors.primary[4] || '#339CFF',
      themeConfig.colors.primary[5] || '#0083FF',
      themeConfig.colors.primary[6] || '#0066CC',
      themeConfig.colors.primary[7] || '#004C99',
      themeConfig.colors.primary[8] || '#003366',
      themeConfig.colors.primary[9] || '#001933'
    ];
    
    const themeConfig_: MantineThemeOverride = {
      // Set default radius and font
      defaultRadius: 'md',
      fontFamily: 'Inter, sans-serif',
      
      // Use our primary color palette
      primaryColor: 'blue',
      colors: {
        blue: primaryColors
      },
      
      // Components styling
      components: {
        AppShell: {
          styles: {
            main: { 
              background: themeConfig.colors.background.app
            }
          }
        },
        Paper: {
          defaultProps: {
            shadow: 'sm',
            radius: 'md',
            withBorder: true
          },
          styles: {
            root: {
              backgroundColor: themeConfig.colors.background.paper
            }
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
              color: themeConfig.colors.text.primary,
              '&[dataChecked="true"]': {
                textDecoration: 'line-through',
                color: themeConfig.colors.text.completed
              }
            }
          }
        },
        Checkbox: {
          styles: {
            label: {
              color: themeConfig.colors.text.primary
            }
          }
        },
        Title: {
          styles: {
            root: {
              color: themeConfig.colors.text.primary
            }
          }
        },
        NavLink: {
          styles: {
            root: {
              color: themeConfig.colors.text.primary,
              '&[data-active]': {
                color: 'var(--mantine-color-blue-6)'
              }
            }
          }
        },
        Stack: {
          styles: {
            root: {
              color: themeConfig.colors.text.primary
            }
          }
        },
      },
    };
    
    return themeConfig_;
  }, [themeConfig]);
  
  // Ensure mantineScheme is only 'light' or 'dark'
  const colorMode = themeConfig.mantineScheme === 'dark' ? 'dark' : 'light';
  
  return (
    <MantineProvider 
      theme={theme} 
      forceColorScheme={colorMode}
      defaultColorScheme={colorMode}
    >
      <Notifications position="top-right" autoClose={6000} />
      <Layout>{children}</Layout>
    </MantineProvider>
  );
} 