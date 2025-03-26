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
  Checkbox,
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
      setLoading(true);
      const response = await axiosInstance.get<Goal[]>('/goals');
      
      // Get all goals but sort them by multiple criteria
      const sortedGoals = response.data.sort((a: Goal, b: Goal) => {
        // First sort by completion (incomplete first)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        // Then by pinned status (pinned first for incomplete goals)
        if (!a.completed && !b.completed && a.is_pinned !== b.is_pinned) {
          return a.is_pinned ? -1 : 1;
        }
        // Finally by creation date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      console.log('Fetched and sorted goals:', sortedGoals);
      setGoals(sortedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
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
      // Optimistically update the UI
      setGoals(prevGoals => prevGoals.map(g => 
        g.id === goalId 
          ? {...g, is_pinned: !goal.is_pinned} 
          : g
      ));

      // Wait for the API call to complete
      await axiosInstance.put(`/goals/${goalId}`, {
        is_pinned: !goal.is_pinned,
        title: goal.title,  // Required field
        description: goal.description,
      });
      
      // After API call completes, fetch updated data
      await fetchGoals();
      
      notifications.show({
        title: 'Success',
        message: `Goal ${goal.is_pinned ? 'unpinned' : 'pinned'}`,
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating goal pin status:', error);
      // If the API call fails, revert the optimistic update
      fetchGoals();
      
      notifications.show({
        title: 'Error',
        message: 'Failed to update goal. Please try again.',
        color: 'red',
      });
    }
  };

  const handleToggleComplete = async (goalId: number, completed: boolean) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    try {
      // When marking a goal as completed, we also want to unpin it if it is getting completed
      const shouldBeCompleted = !completed;
      // Keep pinned status if uncompleting, remove pinned if completing
      const shouldBePinned = shouldBeCompleted ? false : goal.is_pinned;
      
      console.log('Goal before update:', goal);
      console.log('Setting goal completion to:', shouldBeCompleted);
      console.log('Setting pinned status to:', shouldBePinned);
      
      // Optimistically update the UI
      setGoals(prevGoals => prevGoals.map(g => 
        g.id === goalId 
          ? {...g, completed: shouldBeCompleted, is_pinned: shouldBePinned} 
          : g
      ));

      // Prepare the payload with explicit types
      const updatePayload = {
        completed: shouldBeCompleted,
        title: goal.title,  // Required field
        is_pinned: shouldBePinned, // Include pinned status in update
      };
      
      console.log('Update payload:', updatePayload);

      // Wait for the API call to complete before doing anything else
      const response = await axiosInstance.put(`/goals/${goalId}`, updatePayload);
      
      console.log('API response:', response.data);
      
      // Only after API call is complete, fetch the updated data
      await fetchGoals();
      
      const actionMessage = shouldBeCompleted 
        ? 'Goal marked as completed' + (goal.is_pinned ? ' and unpinned' : '')
        : 'Goal marked as incomplete';
        
      notifications.show({
        title: 'Success',
        message: actionMessage,
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating goal:', error);
      // Revert the optimistic update if the API call fails
      fetchGoals();
      
      notifications.show({
        title: 'Error',
        message: 'Failed to update goal. Please try again.',
        color: 'red',
      });
    }
  };

  // Group goals by their status
  const pinnedGoals = goals.filter(goal => goal.is_pinned && !goal.completed);
  const activeGoals = goals.filter(goal => !goal.is_pinned && !goal.completed);
  const completedGoals = goals.filter(goal => goal.completed);

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

        {pinnedGoals.length > 0 && (
          <>
            <Text size="lg" fw={600} mt="md" mb="xs">Pinned Goals</Text>
            <Grid>
              {pinnedGoals.map((goal) => (
                <GoalCard 
                  key={goal.id} 
                  goal={goal}
                  onTogglePin={handleTogglePin}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleOpenModal}
                  onDelete={handleDelete}
                />
              ))}
            </Grid>
          </>
        )}

        {activeGoals.length > 0 && (
          <>
            <Text size="lg" fw={600} mt="md" mb="xs">Active Goals</Text>
            <Grid>
              {activeGoals.map((goal) => (
                <GoalCard 
                  key={goal.id} 
                  goal={goal}
                  onTogglePin={handleTogglePin}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleOpenModal}
                  onDelete={handleDelete}
                />
              ))}
            </Grid>
          </>
        )}
        
        {completedGoals.length > 0 && (
          <>
            <Text size="lg" fw={600} mt="md" mb="xs">Completed Goals</Text>
            <Grid>
              {completedGoals.map((goal) => (
                <GoalCard 
                  key={goal.id} 
                  goal={goal}
                  onTogglePin={handleTogglePin}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleOpenModal}
                  onDelete={handleDelete}
                />
              ))}
            </Grid>
          </>
        )}

        <GoalModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          onGoalAdded={fetchGoals}
          initialData={selectedGoal ? {
            id: selectedGoal.id,
            title: selectedGoal.title,
            description: selectedGoal.description || '',
            is_pinned: selectedGoal.is_pinned,
            completed: selectedGoal.completed
          } : undefined}
        />
      </Box>
    </Box>
  );
}

// Extracted goal card component for reusability
function GoalCard({ 
  goal, 
  onTogglePin, 
  onToggleComplete, 
  onEdit, 
  onDelete 
}: { 
  goal: Goal, 
  onTogglePin: (id: number) => void,
  onToggleComplete: (id: number, completed: boolean) => void,
  onEdit: (goal: Goal) => void,
  onDelete: (id: number) => void
}) {
  return (
    <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={goal.id}>
      <Card withBorder style={{ opacity: goal.completed ? 0.8 : 1 }}>
        <Stack gap="xs">
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs">
              <Checkbox
                checked={goal.completed}
                onChange={() => onToggleComplete(goal.id, goal.completed)}
                aria-label={`Mark ${goal.title} as ${goal.completed ? 'incomplete' : 'completed'}`}
              />
              <Text fw={500} truncate style={{ textDecoration: goal.completed ? 'line-through' : 'none' }}>
                {goal.title}
              </Text>
            </Group>
            <Group gap="xs">
              <ActionIcon
                variant={goal.is_pinned ? 'filled' : 'light'}
                color={goal.is_pinned ? 'blue' : 'gray'}
                onClick={() => onTogglePin(goal.id)}
                disabled={goal.completed} // Can't pin completed goals
              >
                {goal.is_pinned ? <IconPinnedFilled size={16} /> : <IconPinned size={16} />}
              </ActionIcon>
              <ActionIcon
                variant="light"
                onClick={() => onEdit(goal)}
              >
                <IconEdit size={16} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="red"
                onClick={() => onDelete(goal.id)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          </Group>

          {goal.description && (
            <Text 
              size="sm" 
              c="dimmed" 
              lineClamp={2}
              style={{ textDecoration: goal.completed ? 'line-through' : 'none' }}
            >
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
  );
} 