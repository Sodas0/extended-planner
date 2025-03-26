'use client';

import { create } from 'zustand';
import { StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { MantineColorScheme } from '@mantine/core';

export type ColorScheme = 'light' | 'dark' | 'blue';

export interface ThemeColors {
  primary: string[];
  background: {
    app: string;
    paper: string;
  };
  text: {
    primary: string;
    secondary: string;
    dimmed: string;
    completed: string;
  };
  activity: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
  };
}

export interface ThemeConfig {
  colors: ThemeColors;
  mantineScheme: MantineColorScheme;
}

// Define theme configurations
const themeConfigs: Record<ColorScheme, ThemeConfig> = {
  light: {
    mantineScheme: 'light',
    colors: {
      primary: [
        '#E6F3FF', '#CCE7FF', '#99CEFF', '#66B5FF', 
        '#339CFF', '#0083FF', '#0066CC', '#004C99', 
        '#003366', '#001933',
      ],
      background: {
        app: 'var(--mantine-color-gray-0)',
        paper: 'var(--mantine-color-white)',
      },
      text: {
        primary: 'var(--mantine-color-dark-9)',
        secondary: 'var(--mantine-color-dark-7)',
        dimmed: 'var(--mantine-color-dark-5)',
        completed: 'var(--mantine-color-gray-7)',
      },
      activity: {
        0: '#ebedf0',
        1: '#9be9a8',
        2: '#40c463',
        3: '#30a14e',
        4: '#216e39',
      },
    },
  },
  dark: {
    mantineScheme: 'dark',
    colors: {
      primary: [
        '#0A1929', '#102A43', '#144870', '#186FAF', 
        '#2196F3', '#64B5F6', '#90CAF9', '#BBDEFB', 
        '#E3F2FD', '#F5FAFF',
      ],
      background: {
        app: 'var(--mantine-color-dark-8)',
        paper: 'var(--mantine-color-dark-7)',
      },
      text: {
        primary: 'var(--mantine-color-gray-1)',
        secondary: 'var(--mantine-color-gray-3)',
        dimmed: 'var(--mantine-color-gray-5)',
        completed: 'var(--mantine-color-gray-5)',
      },
      activity: {
        0: '#1e2226',
        1: '#0e4429',
        2: '#006d32',
        3: '#26a641',
        4: '#39d353',
      },
    },
  },
  blue: {
    mantineScheme: 'light',
    colors: {
      primary: [
        '#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6',
        '#42A5F5', '#2196F3', '#1E88E5', '#1976D2',
        '#1565C0', '#0D47A1',
      ],
      background: {
        app: '#f0f7ff',
        paper: 'var(--mantine-color-white)',
      },
      text: {
        primary: '#0A1929',
        secondary: '#144870',
        dimmed: '#186FAF',
        completed: '#64B5F6',
      },
      activity: {
        0: '#eaeff6',
        1: '#b3d1ff',
        2: '#7aaaff',
        3: '#4285f4',
        4: '#1a56e0',
      },
    },
  },
};

interface ThemeStore {
  colorScheme: ColorScheme;
  themeConfig: ThemeConfig;
  setColorScheme: (colorScheme: ColorScheme) => void;
  getThemeValue: (path: string) => any;
}

const createThemeStore: StateCreator<ThemeStore> = (set, get) => ({
  colorScheme: 'light',
  themeConfig: themeConfigs.light,
  setColorScheme: (colorScheme: ColorScheme) => {
    const themeConfig = themeConfigs[colorScheme] || themeConfigs.light;
    set({ colorScheme, themeConfig });
  },
  getThemeValue: (path: string) => {
    const { themeConfig } = get();
    return path.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined, themeConfig.colors as any);
  },
});

export const useTheme = create<ThemeStore>()(
  persist(
    createThemeStore,
    {
      name: 'theme-storage',
    }
  )
); 