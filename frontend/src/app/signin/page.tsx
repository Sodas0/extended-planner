'use client';

import { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Container, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import axiosInstance from '@/utils/axios';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { fetchUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create form data for OAuth2 password flow
      const formData = new FormData();
      formData.append('username', email);  // OAuth2 expects 'username'
      formData.append('password', password);

      const response = await axiosInstance.post('/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Store the token
      localStorage.setItem('token', response.data.access_token);
      
      // Fetch user data immediately
      await fetchUser();
      
      notifications.show({
        title: 'Success',
        message: 'Signed in successfully',
        color: 'green',
      });

      // Redirect to dashboard
      router.push('/');
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to sign in',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Welcome back!</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Don't have an account yet?{' '}
        <Link href="/signup" style={{ color: 'var(--mantine-color-blue-6)' }}>
          Create account
        </Link>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" loading={loading}>
              Sign in
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
} 