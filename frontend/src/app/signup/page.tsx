'use client';

import { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Container, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/utils/axios';
import { useUser } from '@/hooks/useUser';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { fetchUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Register the user
      await axiosInstance.post('/register', {
        email,
        full_name: fullName,
        password,
      });

      // Sign in the user
      const formData = new FormData();
      formData.append('username', email);  // OAuth2 expects 'username'
      formData.append('password', password);

      const loginResponse = await axiosInstance.post('/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Store the token
      localStorage.setItem('token', loginResponse.data.access_token);

      // Fetch user data immediately
      await fetchUser();
      
      notifications.show({
        title: 'Success',
        message: 'Account created successfully',
        color: 'green',
      });

      // Redirect to dashboard
      router.push('/');
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to create account',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Create an account</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Already have an account?{' '}
        <Link href="/signin" style={{ color: 'var(--mantine-color-blue-6)' }}>
          Sign in
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
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" loading={loading}>
              Create account
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
} 