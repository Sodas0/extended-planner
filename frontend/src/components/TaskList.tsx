'use client';

import { List, Checkbox, Text, Button, Group, Paper, ActionIcon, Loader } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import TaskModal from './TaskModal';
import { api, Task } from '../services/api';
import { notifications } from '@mantine/notifications';

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalOpened, setModalOpened] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks when component mounts
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const fetchedTasks = await api.getTasks();
      setTasks(fetchedTasks);
      setError(null);
    } catch (err) {
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

  const handleCreateTask = async (values: { title: string; description: string }) => {
    try {
      const newTask = await api.createTask(values);
      setTasks(prevTasks => [...prevTasks, newTask]);
      setModalOpened(false);
      notifications.show({
        title: 'Success',
        message: 'Task created successfully',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create task',
        color: 'red',
      });
    }
  };

  const toggleTask = async (taskId: number, completed: boolean) => {
    try {
      const updatedTask = await api.updateTask(taskId, { completed: !completed });
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? updatedTask : task
        )
      );
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update task',
        color: 'red',
      });
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      await api.deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      notifications.show({
        title: 'Success',
        message: 'Task deleted successfully',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete task',
        color: 'red',
      });
    }
  };

  if (loading) {
    return (
      <Paper shadow="sm" p="md">
        <Group justify="center">
          <Loader />
        </Group>
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="md">
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={700}>Today's Tasks</Text>
        <Button onClick={() => setModalOpened(true)}>Add Task</Button>
      </Group>

      {error ? (
        <Text c="red">{error}</Text>
      ) : (
        <List spacing="sm" listStyleType="none">
          {tasks.length === 0 ? (
            <Text c="dimmed">No tasks for today</Text>
          ) : (
            tasks.map((task) => (
              <List.Item key={task.id} style={{ position: 'relative' }}>
                <Group wrap="nowrap" style={{ paddingRight: '40px' }}>
                  <Checkbox
                    checked={task.completed}
                    onChange={() => toggleTask(task.id, task.completed)}
                    label={
                      <div>
                        <Text style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                          {task.title}
                        </Text>
                        {task.description && (
                          <Text size="sm" c="dimmed" style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                            {task.description}
                          </Text>
                        )}
                      </div>
                    }
                  />
                </Group>
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={() => deleteTask(task.id)}
                  aria-label="Delete task"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                >
                  <IconTrash size="1.125rem" />
                </ActionIcon>
              </List.Item>
            ))
          )}
        </List>
      )}

      <TaskModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSubmit={handleCreateTask}
      />
    </Paper>
  );
} 