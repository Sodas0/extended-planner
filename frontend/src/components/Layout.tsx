'use client';

import { useEffect } from 'react';
import { AppShell, Group, Button, Text, Avatar, Menu, UnstyledButton } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading, fetchUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();

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
    localStorage.removeItem('token');
    useUser.getState().setUser(null);
    router.push('/signin');
  };

  // Don't show auth buttons on auth pages
  const isAuthPage = pathname === '/signin' || pathname === '/signup';

  return (
    <AppShell
      header={{ height: 60 }}
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

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
} 