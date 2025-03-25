'use client';

import { Modal, TextInput, Textarea, Button, Stack, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';

interface TaskModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: { title: string; description: string }) => void;
}

export default function TaskModal({ opened, onClose, onSubmit }: TaskModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
    },
    validate: {
      title: (value) => (!value ? 'Title is required' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await onSubmit({
        title: values.title,
        description: values.description,
      });
      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create New Task">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            required
            label="Title"
            placeholder="Enter task title"
            {...form.getInputProps('title')}
          />
          
          <Textarea
            label="Description"
            placeholder="Enter task description"
            autosize
            minRows={3}
            {...form.getInputProps('description')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Task
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
} 