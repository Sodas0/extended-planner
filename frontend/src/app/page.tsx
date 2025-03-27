'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Title, Grid, Paper, Text, Group, Button, ActionIcon, Stack, Checkbox } from '@mantine/core';
import { IconPlus, IconTrash, IconPinnedFilled, IconPinned, IconEdit } from '@tabler/icons-react';
import TaskList from '@/components/TaskList';
import GoalModal from '@/components/GoalModal';
import ActivityGraph from '@/components/ActivityGraph';
import { notifications } from '@mantine/notifications';
import axiosInstance from '@/utils/axios';
import { debounce } from 'lodash';

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
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [activityRefreshTrigger, setActivityRefreshTrigger] = useState(0);
  const [graphUpdating, setGraphUpdating] = useState(false);

  // Create a debounced version of the activity refresh trigger update
  // This prevents multiple rapid updates when completing multiple tasks quickly
  const debouncedRefreshTrigger = useCallback(
    debounce(() => {
      console.log('Debounced refresh trigger fired');
      // Use a more random value to ensure React detects the state change
      const randomIncrement = Math.floor(Math.random() * 1000) + 1;
      setActivityRefreshTrigger(prev => prev + randomIncrement);
    }, 300), // Reduced debounce delay for faster response
    [] // Only create this function once
  );

  const fetchPinnedGoals = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get<Goal[]>('/goals');
      
      // Filter pinned goals first
      const pinnedGoalsData = response.data.filter(goal => goal.is_pinned);
      
      // Sort by completion status (incomplete first) and then by creation date (newest first)
      const sortedGoals = pinnedGoalsData.sort((a, b) => {
        // First sort by completion (incomplete first)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        // Then by creation date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      console.log('Fetched and sorted pinned goals:', sortedGoals);
      setPinnedGoals(sortedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch goals',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (goal?: Goal) => {
    setSelectedGoal(goal || null);
    setModalOpened(true);
  };

  const handleTogglePin = async (goalId: number) => {
    const goal = pinnedGoals.find(g => g.id === goalId);
    if (!goal) return;

    try {
      // Optimistically update the UI
      setPinnedGoals(prevGoals => prevGoals.map(g => 
        g.id === goalId 
          ? {...g, is_pinned: !goal.is_pinned} 
          : g
      ));

      // Wait for the API call to complete
      await axiosInstance.put(`/goals/${goalId}`, {
        is_pinned: !goal.is_pinned,
        title: goal.title,  // Required field
        completed: goal.completed, // Preserve completion status
        description: goal.description,
      });
      
      // After API call completes, fetch updated data
      await fetchPinnedGoals();
      
      notifications.show({
        title: 'Success',
        message: goal.is_pinned ? 'Goal unpinned' : 'Goal pinned',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating goal pin status:', error);
      // If the API call fails, revert the optimistic update
      fetchPinnedGoals();
      
      notifications.show({
        title: 'Error',
        message: 'Failed to update goal',
        color: 'red',
      });
    }
  };

  const handleToggleComplete = async (goalId: number, completed: boolean) => {
    const goal = pinnedGoals.find(g => g.id === goalId);
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
      setPinnedGoals(prevGoals => prevGoals.map(g => 
        g.id === goalId 
          ? {...g, completed: shouldBeCompleted, is_pinned: shouldBePinned} 
          : g
      ));

      // Prepare the payload with explicit types
      const updatePayload = {
        completed: shouldBeCompleted,
        title: goal.title,  // Required field
        is_pinned: shouldBePinned,  // Include pinned status in update
      };
      
      console.log('Update payload:', updatePayload);

      // Wait for the API call to complete before doing anything else
      const response = await axiosInstance.put(`/goals/${goalId}`, updatePayload);
      
      console.log('API response:', response.data);
      
      // Only after API call is complete, fetch the updated data
      await fetchPinnedGoals();
      
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
      fetchPinnedGoals();
      
      notifications.show({
        title: 'Error',
        message: 'Failed to update goal completion status',
        color: 'red',
      });
    }
  };

  // Callback for when tasks are updated
  const handleTaskUpdate = useCallback(() => {
    // Use the debounced version to prevent UI jank from rapid updates
    console.log('Task update detected, scheduling refreshTrigger update');
    
    // Indicate that the graph is updating
    setGraphUpdating(true);
    
    // Force immediate refresh for better UX
    // This will make the graph refresh immediately after a task is completed
    const randomValue = Date.now(); // Use timestamp for unique value
    setActivityRefreshTrigger(randomValue);
    
    // Schedule another refresh after a delay in case the first one didn't catch all updates
    setTimeout(() => {
      debouncedRefreshTrigger();
      // Reset the updating state after a reasonable delay
      setTimeout(() => setGraphUpdating(false), 2000);
    }, 1000);
  }, [debouncedRefreshTrigger]);

  // Group pinned goals by completion status
  const activePinnedGoals = pinnedGoals.filter(goal => !goal.completed);
  const completedPinnedGoals = pinnedGoals.filter(goal => goal.completed);

  useEffect(() => {
    fetchPinnedGoals();
  }, []);

  return (
    <Container size="lg">
      <Title order={2} mb="lg">Dashboard</Title>
      
      <Grid>
        {/* Activity Graph */}
        <Grid.Col span={12}>
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" mb="lg">
              <Text size="lg" fw={500}>Activity</Text>
              <Group>
                {graphUpdating && (
                  <Text size="sm" c="dimmed">Updating...</Text>
                )}
                <Button 
                  variant="light" 
                  size="xs" 
                  onClick={() => {
                    console.log("Manual refresh triggered");
                    setGraphUpdating(true);
                    // Force refresh with a new random value
                    const newValue = Date.now();
                    setActivityRefreshTrigger(newValue);
                    // Reset updating state after a delay
                    setTimeout(() => setGraphUpdating(false), 2000);
                  }}
                >
                  Refresh Activity
                </Button>
              </Group>
            </Group>
            <ActivityGraph refreshTrigger={activityRefreshTrigger} />
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
                onClick={() => handleOpenModal()}
              >
                Add Goal
              </Button>
            </Group>
            
            {loading ? (
              <Text>Loading goals...</Text>
            ) : (
              <Stack gap="xs">
                {activePinnedGoals.length === 0 ? (
                  <Text c="dimmed" ta="center">No pinned goals yet. Pin a goal to see it here!</Text>
                ) : (
                  activePinnedGoals.map((goal) => (
                    <Paper key={goal.id} withBorder p="xs">
                      <Group justify="space-between" wrap="nowrap">
                        <Group wrap="nowrap">
                          <Checkbox
                            checked={goal.completed}
                            onChange={() => handleToggleComplete(goal.id, goal.completed)}
                            aria-label={`Mark ${goal.title} as ${goal.completed ? 'incomplete' : 'completed'}`}
                          />
                          <div>
                            <Text fw={500}>
                              {goal.title}
                            </Text>
                            {goal.description && (
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {goal.description}
                              </Text>
                            )}
                          </div>
                        </Group>
                        <Group wrap="nowrap" gap="xs">
                          <ActionIcon
                            variant="light"
                            onClick={() => handleOpenModal(goal)}
                            size="sm"
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color={goal.is_pinned ? 'blue' : 'gray'}
                            onClick={() => handleTogglePin(goal.id)}
                            size="sm"
                          >
                            {goal.is_pinned ? <IconPinnedFilled size={16} /> : <IconPinned size={16} />}
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Paper>
                  ))
                )}

                {completedPinnedGoals.length > 0 && (
                  <>
                    <Text size="sm" fw={500} mt="xs">Completed</Text>
                    {completedPinnedGoals.map((goal) => (
                      <Paper key={goal.id} withBorder p="xs" opacity={0.8}>
                        <Group justify="space-between" wrap="nowrap">
                          <Group wrap="nowrap">
                            <Checkbox
                              checked={goal.completed}
                              onChange={() => handleToggleComplete(goal.id, goal.completed)}
                              aria-label={`Mark ${goal.title} as ${goal.completed ? 'incomplete' : 'completed'}`}
                            />
                            <div>
                              <Text fw={500}>
                                {goal.title}
                              </Text>
                              {goal.description && (
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {goal.description}
                                </Text>
                              )}
                            </div>
                          </Group>
                          <Group wrap="nowrap" gap="xs">
                            <ActionIcon
                              variant="light"
                              onClick={() => handleOpenModal(goal)}
                              size="sm"
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color={goal.is_pinned ? 'blue' : 'gray'}
                              onClick={() => handleTogglePin(goal.id)}
                              size="sm"
                            >
                              {goal.is_pinned ? <IconPinnedFilled size={16} /> : <IconPinned size={16} />}
                            </ActionIcon>
                          </Group>
                        </Group>
                      </Paper>
                    ))}
                  </>
                )}
              </Stack>
            )}
          </Paper>
        </Grid.Col>

        {/* Tasks Section */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TaskList onTaskUpdate={handleTaskUpdate} />
        </Grid.Col>
      </Grid>

      <GoalModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onGoalAdded={fetchPinnedGoals}
        initialData={selectedGoal ? {
          id: selectedGoal.id,
          title: selectedGoal.title,
          description: selectedGoal.description || '',
          is_pinned: selectedGoal.is_pinned,
          completed: selectedGoal.completed
        } : undefined}
        defaultIsPinned={true}
      />
    </Container>
  );
}