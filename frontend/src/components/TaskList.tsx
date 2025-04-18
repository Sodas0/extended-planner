'use client';

import { useState, useEffect } from 'react';
import { Paper, Stack, Checkbox, Group, ActionIcon, Loader, Text, Select, Title, Button } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import axiosInstance from '@/utils/axios';
import TaskModal from './TaskModal';

interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  goal_id: number | null;
}

interface Goal {
  id: number;
  title: string;
}

interface TaskListProps {
  onTaskUpdate?: () => void;
}

export default function TaskList({ onTaskUpdate }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [modalOpened, setModalOpened] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const response = await axiosInstance.get('/tasks');
      setTasks(response.data);
      setError(null);
    } catch (error) {
      setError('Failed to load tasks');
      notifications.show({
        title: 'Error',
        message: 'Failed to load tasks',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await axiosInstance.get('/goals');
      setGoals(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load goals',
        color: 'red',
      });
    }
  };

  useEffect(() => {
    Promise.all([fetchTasks(), fetchGoals()]);
  }, []);

  const toggleTask = async (taskId: number) => {
    try {
      const taskToUpdate = tasks.find(t => t.id === taskId);
      if (!taskToUpdate) return;

      // Check if we're completing or uncompleting
      const isCompleting = !taskToUpdate.completed;
      console.log(`Toggling task ${taskId} from ${taskToUpdate.completed} to ${isCompleting}`);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      console.log(`Current local date: ${today}`);
      
      // Optimistically update UI
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? {...task, completed: isCompleting} : task
        )
      );
      
      // Make the API call to update the server with today's date
      const response = await axiosInstance.patch(`/tasks/${taskId}?today=${today}`, {
        completed: isCompleting,
      });

      console.log('Task update response:', response.data);
      
      // Update with server response data
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? response.data : task
        )
      );
      
      // IMPORTANT: For task completion, also directly increment the activity counter
      // This ensures the activity counter is updated properly regardless of other issues
      if (isCompleting) {
        try {
          console.log('Task completed - directly incrementing activity counter');
          // Pass today parameter to ensure consistent date handling
          const activityResponse = await axiosInstance.post(`/users/me/activity/increment?today=${today}`);
          console.log('Activity increment response:', activityResponse.data);
        } catch (activityError) {
          console.error('Failed to increment activity counter:', activityError);
        }
        
        // Always call onTaskUpdate after server confirms the update
        console.log('Server confirmed task completion - ensuring activity graph updates');
        setTimeout(() => {
          onTaskUpdate?.();
        }, 300);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert optimistic update on error
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? tasks.find(t => t.id === taskId)! : task
        )
      );
      
      notifications.show({
        title: 'Error',
        message: 'Failed to update task',
        color: 'red',
      });
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      await axiosInstance.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(task => task.id !== taskId));
      onTaskUpdate?.();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete task',
        color: 'red',
      });
    }
  };

  const updateTaskGoal = async (taskId: number, goalId: string | null) => {
    try {
      const response = await axiosInstance.patch(`/tasks/${taskId}`, {
        goal_id: goalId ? parseInt(goalId) : null,
      });

      setTasks(tasks.map(task => 
        task.id === taskId ? response.data : task
      ));
      onTaskUpdate?.();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update task goal',
        color: 'red',
      });
    }
  };

  // Handle goal deletion by removing goal_id from associated tasks
  useEffect(() => {
    const goalIds = new Set(goals.map(goal => goal.id));
    const tasksToUpdate = tasks.filter(task => task.goal_id && !goalIds.has(task.goal_id));
    
    tasksToUpdate.forEach(task => {
      updateTaskGoal(task.id, null);
    });
  }, [goals]);

  if (loading) {
    return (
      <Paper shadow="sm" p="md">
        <Title order={3} mb="md">Daily Tasks</Title>
        <Stack align="center">
          <Loader size="lg" />
        </Stack>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper shadow="sm" p="md">
        <Title order={3} mb="md">Daily Tasks</Title>
        <Text c="red" ta="center">
          {error}
        </Text>
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="md">
      <Group justify="space-between" mb="md">
        <Title order={3}>Daily Tasks</Title>
        <Button
          variant="light"
          size="sm"
          leftSection={<IconPlus size={16} />}
          onClick={() => setModalOpened(true)}
        >
          Add Task
        </Button>
      </Group>
      
      <Stack gap="xs">
        {tasks.length === 0 ? (
          <Text c="dimmed" ta="center">No tasks yet. Add your first task above!</Text>
        ) : (
          tasks.map((task) => (
            <Paper key={task.id} withBorder p="sm">
              <Group justify="space-between" wrap="nowrap" align="center">
                <Checkbox
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  label={task.title}
                  styles={{
                    label: {
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? 'var(--mantine-color-gray-6)' : undefined,
                    },
                    root: {
                      alignItems: 'center',
                    },
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Select
                    placeholder="No goal"
                    value={task.goal_id?.toString() || null}
                    onChange={(value) => updateTaskGoal(task.id, value)}
                    data={goals.map(goal => ({
                      value: goal.id.toString(),
                      label: goal.title,
                    }))}
                    clearable
                    size="xs"
                    style={{ width: '150px' }}
                    fw={500}
                    variant="light"
                    color="blue"
                  />
                  <div style={{ width: '34px', display: 'flex', justifyContent: 'center' }}>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => deleteTask(task.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </div>
                </div>
              </Group>
            </Paper>
          ))
        )}
      </Stack>

      <TaskModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onTaskAdded={() => {
          fetchTasks();
          onTaskUpdate?.();
        }}
        goals={goals}
      />
    </Paper>
  );
} 