'use client';

import { List, Checkbox, Text, Button, Group, Paper, ActionIcon } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import TaskModal from './TaskModal';

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const STORAGE_KEY = 'planner-tasks';

// Helper function to safely get tasks from localStorage
const getSavedTasks = (): Task[] => {
  if (typeof window === 'undefined') return [];
  
  const savedTasks = localStorage.getItem(STORAGE_KEY);
  if (!savedTasks) return [];
  
  try {
    return JSON.parse(savedTasks);
  } catch (error) {
    console.error('Failed to parse saved tasks:', error);
    return [];
  }
};

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalOpened, setModalOpened] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true);
    const savedTasks = getSavedTasks();
    setTasks(savedTasks);
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, isClient]);

  const handleCreateTask = async (values: { title: string; description: string }) => {
    const newTask: Task = {
      id: Date.now(),
      title: values.title,
      description: values.description,
      completed: false,
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
  };

  const toggleTask = (taskId: number) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
  };

  const deleteTask = (taskId: number) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
  };

  if (!isClient) {
    return null; // or a loading state
  }

  return (
    <Paper shadow="sm" p="md">
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={700}>Today's Tasks</Text>
        <Button onClick={() => setModalOpened(true)}>Add Task</Button>
      </Group>

      <List spacing="sm" listStyleType="none">
        {tasks.length === 0 ? (
          <Text c="dimmed">No tasks for today</Text>
        ) : (
          tasks.map((task) => (
            <List.Item key={task.id} style={{ position: 'relative' }}>
              <Group wrap="nowrap" style={{ paddingRight: '40px' }}>
                <Checkbox
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
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

      <TaskModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSubmit={handleCreateTask}
      />
    </Paper>
  );
} 