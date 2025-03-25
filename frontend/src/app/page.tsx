'use client';

import { useState } from 'react';
import { Container, Title, Grid, Paper, Text, Group, Button, ActionIcon, Stack } from '@mantine/core';
import { IconPlus, IconTrash, IconPinnedFilled, IconPinned } from '@tabler/icons-react';
import TaskList from '@/components/TaskList';
import GoalModal from '@/components/GoalModal';
import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import axiosInstance from '@/utils/axios';

interface Goal {
  id: number;
  title: string;
  description: string | null;
  target_date: string | null;
  is_pinned: boolean;
  completed: boolean;
  created_at: string;
  updated_at: string | null;
  owner_id: number;
  tasks: any[];
}

export default function Home() {
  const [modalOpened, setModalOpened] = useState(false);
  const [pinnedGoals, setPinnedGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPinnedGoals = async () => {
    try {
      const response = await axiosInstance.get<Goal[]>('/goals');
      // Filter and sort pinned goals
      const pinned = response.data
        .filter(goal => goal.is_pinned)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPinnedGoals(pinned);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch pinned goals',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    try {
      await axiosInstance.delete(`/goals/${goalId}`);
      notifications.show({
        title: 'Success',
        message: 'Goal deleted successfully',
        color: 'green',
      });
      fetchPinnedGoals();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete goal',
        color: 'red',
      });
    }
  };

  const handleTogglePin = async (goalId: number) => {
    try {
      await axiosInstance.put(`/goals/${goalId}`, {
        is_pinned: false,  // Since these are pinned goals, we're only unpinning them
        title: pinnedGoals.find(g => g.id === goalId)?.title || '',  // Required field
      });
      fetchPinnedGoals();
      notifications.show({
        title: 'Success',
        message: 'Goal unpinned',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to unpin goal. Please try again.',
        color: 'red',
      });
    }
  };

  useEffect(() => {
    fetchPinnedGoals();
  }, []);

  return (
    <Container size="lg">
      <Title order={2} mb="lg">Dashboard</Title>
      
      <Grid>
        {/* Activity Graph */}
        <Grid.Col span={12}>
          <Paper shadow="sm" p="md">
            <Title order={3} mb="md">Activity Graph</Title>
            <div style={{ height: '200px', background: '#f1f3f5' }}>
              {/* Placeholder for GitHub-style graph */}
              <Text c="dimmed" ta="center" pt="xl">
                Activity graph will be implemented here
              </Text>
            </div>
          </Paper>
        </Grid.Col>

        {/* Pinned Goals */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="sm" p="md">
            <Group justify="space-between" mb="md">
              <Title order={3}>Pinned Goals</Title>
              <Button
                variant="light"
                size="sm"
                leftSection={<IconPlus size={16} />}
                onClick={() => setModalOpened(true)}
              >
                Add Goal
              </Button>
            </Group>
            
            {pinnedGoals.length > 0 ? (
              <Stack gap="xs">
                {pinnedGoals.map((goal) => (
                  <Paper
                    key={goal.id}
                    withBorder
                    p="sm"
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <div style={{ flex: 1 }}>
                        <Text fw={500} mb={goal.description ? 4 : 0}>
                          {goal.title}
                        </Text>
                        {goal.description && (
                          <Text size="sm" c="dimmed" lineClamp={2}>
                            {goal.description}
                          </Text>
                        )}
                        {goal.tasks.length > 0 && (
                          <Text size="sm" c="dimmed" mt={4}>
                            {goal.tasks.filter(t => t.completed).length}/{goal.tasks.length} tasks completed
                          </Text>
                        )}
                      </div>
                      <Group gap="xs">
                        <ActionIcon
                          variant="filled"
                          color="blue"
                          onClick={() => handleTogglePin(goal.id)}
                        >
                          <IconPinnedFilled size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed">No pinned goals yet</Text>
            )}
          </Paper>
        </Grid.Col>

        {/* Daily Tasks */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TaskList onTaskUpdate={fetchPinnedGoals} />
        </Grid.Col>
      </Grid>

      <GoalModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onGoalAdded={fetchPinnedGoals}
        defaultIsPinned={true}
      />
    </Container>
  );
}
