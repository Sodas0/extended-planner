'use client';

import { useState, useEffect } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Container, Stack, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import axiosInstance from '@/utils/axios';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { fetchUser } = useUser();

  // Clear any notifications when component mounts or unmounts
  useEffect(() => {
    return () => {
      notifications.clean();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    
    // Clean any existing notifications
    notifications.clean();

    try {
      // Create form data for OAuth2 password flow
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axiosInstance.post('/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Store the token
      localStorage.setItem('token', response.data.access_token);
      
      // Fetch user data immediately after successful login
      await fetchUser();
      
      notifications.show({
        title: 'Success',
        message: 'Signed in successfully',
        color: 'green',
      });

      // Redirect to dashboard
      router.push('/');
    } catch (error: any) {
      // For authentication errors (401), show both alert and notification
      if (error.response?.status === 401) {
        const errorMessage = 'Invalid email or password. Please try again.';
        setError(errorMessage);
        
        // Also show a persistent notification that won't auto-close
        notifications.show({
          title: 'Authentication Error',
          message: errorMessage,
          color: 'red',
          icon: <IconAlertCircle />,
          autoClose: false,
          withCloseButton: true,
        });
      } else {
        const errorMessage = error.response?.data?.detail || 'Failed to sign in';
        setError(errorMessage);
        
        // Also show a persistent notification that won't auto-close
        notifications.show({
          title: 'Error',
          message: errorMessage,
          color: 'red',
          icon: <IconAlertCircle />,
          autoClose: false,
          withCloseButton: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // We don't auto-clear the error anymore when fields change
  // This gives users time to read the error message

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
            {error && (
              <Alert 
                color="red" 
                title="Authentication Error" 
                icon={<IconAlertCircle />}
                withCloseButton
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}
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