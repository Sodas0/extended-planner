'use client';

import { useState } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Switch,
  Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import axiosInstance from '@/utils/axios';

interface GoalModalProps {
  opened: boolean;
  onClose: () => void;
  onGoalAdded?: () => void;
  initialData?: {
    id: number;
    title: string;
    description?: string;
    is_pinned: boolean;
  };
  defaultIsPinned?: boolean;
}

export default function GoalModal({ opened, onClose, onGoalAdded, initialData, defaultIsPinned = false }: GoalModalProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '')
  const [isPinned, setIsPinned] = useState(initialData?.is_pinned || defaultIsPinned);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a title for the goal',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const endpoint = initialData ? `/goals/${initialData.id}` : '/goals';
      const method = initialData ? 'patch' : 'post';
      const data = {
        title: title.trim(),
        description: description.trim() || null,
        is_pinned: isPinned,
      };

      await axiosInstance[method](endpoint, data);

      notifications.show({
        title: 'Success',
        message: `Goal ${initialData ? 'updated' : 'created'} successfully`,
        color: 'green',
      });

      onGoalAdded?.();
      onClose();
      setTitle('');
      setDescription('');   
      setIsPinned(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save goal. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={3}>{initialData ? 'Edit Goal' : 'Add Goal'}</Title>}
      size="md"
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="Enter goal title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            styles={{ label: { color: 'black', fontWeight: 500 } }}
          />

          <Textarea
            label="Description"
            placeholder="Enter goal description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autosize
            minRows={3}
            styles={{ label: { color: 'black', fontWeight: 500 } }}
          />

          <Switch
            label="Pin this goal"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.currentTarget.checked)}
            styles={{ label: { color: 'black', fontWeight: 500 } }}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>
              {initialData ? 'Update Goal' : 'Add Goal'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
} 