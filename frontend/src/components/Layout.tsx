'use client';

import { AppShell, Text, Group } from '@mantine/core';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Text size="lg" fw={700}>Extended Planner</Text>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
} 