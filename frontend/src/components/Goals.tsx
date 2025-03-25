'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Text,
  ActionIcon,
  Group,
  Stack,
  Grid,
  LoadingOverlay,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconPinnedFilled, IconPinned } from '@tabler/icons-react';
import { format } from 'date-fns';
import axiosInstance from '@/utils/axios';
import GoalModal from './GoalModal';

interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string | null;
  owner_id: number;
}

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
  tasks: Task[];
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const fetchGoals = async () => {
    try {
      const response = await axiosInstance.get<Goal[]>('/goals');
      // Sort goals: pinned first, then by creation date
      const sortedGoals = response.data.sort((a: Goal, b: Goal) => {
        if (a.is_pinned !== b.is_pinned) {
          return b.is_pinned ? 1 : -1;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setGoals(sortedGoals);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch goals. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleOpenModal = (goal?: Goal) => {
    setSelectedGoal(goal || null);
    setModalOpened(true);
  };

  const handleDelete = async (goalId: number) => {
    try {
      await axiosInstance.delete(`/goals/${goalId}`);
      notifications.show({
        title: 'Success',
        message: 'Goal deleted successfully',
        color: 'green',
      });
      fetchGoals();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete goal. Please try again.',
        color: 'red',
      });
    }
  };

  const handleTogglePin = async (goalId: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    try {
      await axiosInstance.put(`/goals/${goalId}`, {
        is_pinned: !goal.is_pinned,
        title: goal.title,  // Required field
        description: goal.description,
      });
      fetchGoals();
      notifications.show({
        title: 'Success',
        message: `Goal ${goal.is_pinned ? 'unpinned' : 'pinned'}`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update goal. Please try again.',
        color: 'red',
      });
    }
  };

  return (
    <Box p="md">
      <Box pos="relative" style={{ minHeight: '80vh' }}>
        <LoadingOverlay visible={loading} />
        
        <Group justify="space-between" mb="lg">
          <Text size="xl" fw={700}>Goals</Text>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => handleOpenModal()}
          >
            Add Goal
          </Button>
        </Group>

        <Grid>
          {goals.map((goal) => (
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={goal.id}>
              <Card withBorder>
                <Stack gap="xs">
                  <Group justify="space-between" wrap="nowrap">
                    <Text fw={500} truncate>
                      {goal.title}
                    </Text>
                    <Group gap="xs">
                      <ActionIcon
                        variant={goal.is_pinned ? 'filled' : 'light'}
                        color={goal.is_pinned ? 'blue' : 'gray'}
                        onClick={() => handleTogglePin(goal.id)}
                      >
                        {goal.is_pinned ? <IconPinnedFilled size={16} /> : <IconPinned size={16} />}
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        onClick={() => handleOpenModal(goal)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(goal.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>

                  {goal.description && (
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {goal.description}
                    </Text>
                  )}

                  {goal.target_date && (
                    <Text size="sm" c="dimmed">
                      Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                    </Text>
                  )}

                  {goal.tasks.length > 0 && (
                    <Text size="sm" c="dimmed">
                      Tasks: {goal.tasks.filter(t => t.completed).length}/{goal.tasks.length} completed
                    </Text>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        <GoalModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          onGoalAdded={fetchGoals}
          initialData={selectedGoal ? {
            id: selectedGoal.id,
            title: selectedGoal.title,
            description: selectedGoal.description || '',
            is_pinned: selectedGoal.is_pinned,
          } : undefined}
        />
      </Box>
    </Box>
  );
} 