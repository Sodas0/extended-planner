'use client';

import { useEffect, useState } from 'react';
import { AppShell, Group, Button, Text, Avatar, Menu, UnstyledButton, NavLink, ActionIcon } from '@mantine/core';
import { IconChevronDown, IconHome, IconTarget, IconSettings } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import SettingsModal from './SettingsModal';
import { useTheme } from '@/hooks/useTheme';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading, fetchUser } = useUser();
  const { setColorScheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [settingsOpened, setSettingsOpened] = useState(false);

  useEffect(() => {
    fetchUser();

    // Add event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        fetchUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchUser]);

  const handleSignOut = () => {
    // First remove auth token
    localStorage.removeItem('token');
    
    // Clear the user state
    useUser.getState().setUser(null);
    
    // Reset theme properly
    // 1. First set the theme in the state store to trigger UI update
    setColorScheme('light');
    
    // 2. Then remove the persisted theme data completely
    localStorage.removeItem('theme-storage');
    
    // 3. Set the document attribute directly for immediate visual change
    document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
    document.documentElement.style.colorScheme = 'light';
    
    // Navigate to sign-in page
    router.push('/signin');
  };

  // Don't show auth buttons on auth pages
  const isAuthPage = pathname === '/signin' || pathname === '/signup';

  return (
    <>
      <AppShell
        header={{ height: 60 }}
        navbar={!isAuthPage && user ? {
          width: 300,
          breakpoint: 'sm',
        } : undefined}
        padding="md"
        styles={{
          main: {
            paddingLeft: 'var(--mantine-spacing-md)',
            paddingRight: 'var(--mantine-spacing-md)',
          },
        }}
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Text
              size="lg"
              fw={700}
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
              component={Link}
              href="/"
              style={{ textDecoration: 'none' }}
            >
              Extended Planner
            </Text>

            {!isAuthPage && (
              <Group>
                <ActionIcon 
                  variant="subtle" 
                  radius="xl" 
                  aria-label="Settings"
                  onClick={() => setSettingsOpened(true)}
                >
                  <IconSettings size={20} />
                </ActionIcon>
                {loading ? null : user ? (
                  <Menu position="bottom-end">
                    <Menu.Target>
                      <UnstyledButton>
                        <Group gap="xs">
                          <Avatar
                            size={34}
                            color="blue"
                            radius="xl"
                          >
                            {user.full_name.charAt(0)}
                          </Avatar>
                          <div style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>
                              {user.full_name}
                            </Text>
                            <Text c="dimmed" size="xs">
                              {user.email}
                            </Text>
                          </div>
                          <IconChevronDown size={16} />
                        </Group>
                      </UnstyledButton>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item color="red" onClick={handleSignOut}>
                        Sign out
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                ) : (
                  <Group>
                    <Button variant="default" component={Link} href="/signin">
                      Sign in
                    </Button>
                    <Button component={Link} href="/signup">
                      Sign up
                    </Button>
                  </Group>
                )}
              </Group>
            )}
          </Group>
        </AppShell.Header>

        {!isAuthPage && user && (
          <AppShell.Navbar p="md">
            <NavLink
              label="Dashboard"
              leftSection={<IconHome size={16} />}
              component={Link}
              href="/"
              active={pathname === '/'}
            />
            <NavLink
              label="Goals"
              leftSection={<IconTarget size={16} />}
              component={Link}
              href="/goals"
              active={pathname === '/goals'}
            />
          </AppShell.Navbar>
        )}

        <AppShell.Main>
          {children}
        </AppShell.Main>
      </AppShell>

      <SettingsModal opened={settingsOpened} onClose={() => setSettingsOpened(false)} />
    </>
  );
} 