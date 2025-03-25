'use client';

import { Container, Title, Grid, Paper, Text } from '@mantine/core';
import TaskList from '@/components/TaskList';

export default function Home() {
  return (
    <Container size="lg">
      <Title order={2} mb="lg">Dashboard</Title>
      
      <Grid>
        {/* Consistency Graph */}
        <Grid.Col span={12}>
          <Paper shadow="sm" p="md">
            <Title order={3} mb="md">Activity Graph</Title>
            <div style={{ height: '200px', background: '#f1f3f5' }}>
              {/* Placeholder for GitHub-style graph */}
              <Text c="dimmed" ta="center" pt="xl">
                Activity graph will be implemented here
              </Text>
            </div>
          </Paper>
        </Grid.Col>

        {/* Pinned Goals */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="sm" p="md">
            <Title order={3} mb="md">Pinned Goals</Title>
            <Text c="dimmed">No pinned goals yet</Text>
          </Paper>
        </Grid.Col>

        {/* Daily Tasks */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TaskList />
        </Grid.Col>
      </Grid>
    </Container>
  );
}
