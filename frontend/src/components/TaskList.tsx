'use client';

import { useState, useEffect } from 'react';
import { Paper, TextInput, Button, Stack, Checkbox, Group, ActionIcon, Loader, Text } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';

interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data);
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

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTaskTitle,
          description: '',
        }),
      });

      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const newTask = await response.json();
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create task',
        color: 'red',
      });
    }
  };

  const toggleTask = async (taskId: number) => {
    try {
      const token = localStorage.getItem('token');
      const taskToUpdate = tasks.find(t => t.id === taskId);
      if (!taskToUpdate) return;

      const response = await fetch(`http://localhost:8000/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          completed: !taskToUpdate.completed,
        }),
      });

      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();
      setTasks(tasks.map(task => 
        task.id === taskId ? updatedTask : task
      ));
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update task',
        color: 'red',
      });
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete task',
        color: 'red',
      });
    }
  };

  if (loading) {
    return (
      <Stack align="center" mt="xl">
        <Loader size="lg" />
      </Stack>
    );
  }

  if (error) {
    return (
      <Text c="red" ta="center" mt="xl">
        {error}
      </Text>
    );
  }

  return (
    <Stack gap="md">
      <Paper component="form" onSubmit={handleCreateTask} p="md">
        <Group>
          <TextInput
            placeholder="Add a new task"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button type="submit">Add Task</Button>
        </Group>
      </Paper>

      {tasks.length === 0 ? (
        <Text c="dimmed" ta="center">No tasks yet. Add your first task above!</Text>
      ) : (
        tasks.map((task) => (
          <Paper key={task.id} p="md">
            <Group justify="space-between">
              <Checkbox
                label={task.title}
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                styles={{
                  label: {
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? 'var(--mantine-color-gray-7)' : 'var(--mantine-color-dark-9)',
                  },
                }}
              />
              <ActionIcon
                variant="light"
                color="red"
                onClick={() => deleteTask(task.id)}
                aria-label="Delete task"
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          </Paper>
        ))
      )}
    </Stack>
  );
} 