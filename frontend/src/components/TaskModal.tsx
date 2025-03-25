'use client';

import { Modal, TextInput, Button, Group, Select, Title } from '@mantine/core';
import { useState } from 'react';
import axiosInstance from '@/utils/axios';
import { notifications } from '@mantine/notifications';

interface Goal {
  id: number;
  title: string;
}

interface TaskModalProps {
  opened: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
  goals: Goal[];
}

export default function TaskModal({ opened, onClose, onTaskAdded, goals }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await axiosInstance.post('/tasks', {
        title: title.trim(),
        description: '',
        goal_id: selectedGoal ? parseInt(selectedGoal) : null,
      });

      notifications.show({
        title: 'Success',
        message: 'Task created successfully',
        color: 'green',
      });

      setTitle('');
      setSelectedGoal(null);
      onTaskAdded();
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create task',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={<Title order={3}>Add Task</Title>} centered>
      <form onSubmit={handleSubmit}>
        <TextInput
          label="Task Title"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          mb="md"
          required
          styles={{ label: { color: 'black', fontWeight: 500 } }}
        />
        
        <Select
          label="Assign to Goal (optional)"
          placeholder="Select a goal"
          value={selectedGoal}
          onChange={setSelectedGoal}
          data={goals.map(goal => ({
            value: goal.id.toString(),
            label: goal.title,
          }))}
          clearable
          mb="xl"
          styles={{ label: { color: 'black', fontWeight: 500 } }}
        />

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Task</Button>
        </Group>
      </form>
    </Modal>
  );
} 