import { Paper, Text, Group, Box, Tooltip } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';

// This interface will be used when implementing real data fetching
interface ActivityData {
  date: string;
  count: number;
}

export default function ActivityGraph() {
  const [activityData, setActivityData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { themeConfig } = useTheme();
  
  useEffect(() => {
    // Generate random activity data for demonstration
    generateRandomActivityData();
  }, []);

  const generateRandomActivityData = () => {
    const data: Record<string, number> = {};
    const today = new Date();
    
    // Generate data for the past 365 days
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      // Random activity count between 0 and 4
      const activityCount = Math.floor(Math.random() * 5);
      data[dateStr] = activityCount;
    }
    
    setActivityData(data);
    setLoading(false);
  };

  const getActivityColor = (count: number) => {
    return themeConfig.colors.activity[count as keyof typeof themeConfig.colors.activity];
  };

  const renderGraph = () => {
    // Get days of the week (0 = Sunday, 1 = Monday, ...)
    const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
    
    // Generate dates for the last 365 days (most recent last)
    const today = new Date();
    const dates = Array.from({ length: 365 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - 364 + i);
      return date;
    });
    
    // Calculate the first day of the week for padding
    const firstDate = dates[0];
    const firstDay = firstDate.getDay(); // 0 = Sunday, 1 = Monday, ...
    
    // Add padding cells before the first day
    const paddingCells = Array.from({ length: firstDay }, (_, i) => null);
    const allDates = [...paddingCells, ...dates];
    
    // Group into weeks
    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];
    
    allDates.forEach((date, index) => {
      currentWeek.push(date);
      if (currentWeek.length === 7 || index === allDates.length - 1) {
        // If the last week is incomplete, pad it
        if (currentWeek.length < 7) {
          currentWeek = [...currentWeek, ...Array(7 - currentWeek.length).fill(null)];
        }
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    // Cell dimensions - increased for better visibility
    const cellSize = 15;
    const cellMargin = 2;

    return (
      <Box w="100%" mih={180}>
        <Box style={{ display: 'flex', justifyContent: 'center' }}>
          <Group align="flex-start" gap={cellMargin} wrap="nowrap">
            {/* Day labels */}
            <Box>
              {dayLabels.map((day, i) => (
                <Text key={i} size="xs" c="dimmed" h={cellSize} my={cellMargin}>{day}</Text>
              ))}
            </Box>
            
            {/* Calendar grid - wrap in a scrollable container */}
            <Box style={{ overflowX: 'auto', maxWidth: 'calc(100vw - 150px)' }}>
              <Group gap={cellMargin} wrap="nowrap" style={{ minWidth: 'max-content' }}>
                {weeks.map((week, weekIndex) => (
                  <Box key={weekIndex}>
                    {week.map((date, dayIndex) => {
                      if (date === null) {
                        // Empty cell for padding
                        return <Box key={`empty-${dayIndex}`} w={cellSize} h={cellSize} my={cellMargin} />;
                      }
                      
                      const dateStr = date.toISOString().split('T')[0];
                      const count = activityData[dateStr] || 0;
                      const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });
                      
                      return (
                        <Tooltip 
                          key={dateStr}
                          label={`${count} contributions on ${formattedDate}`}
                          position="top"
                          withArrow
                        >
                          <Box
                            w={cellSize}
                            h={cellSize}
                            my={cellMargin}
                            style={{
                              backgroundColor: getActivityColor(count),
                              borderRadius: '2px',
                              transition: 'background-color 0.2s ease'
                            }}
                          />
                        </Tooltip>
                      );
                    })}
                  </Box>
                ))}
              </Group>
            </Box>
          </Group>
        </Box>
        
        {/* Legend */}
        <Group justify="center" gap="xs" mt="lg">
          <Text size="sm" fw={500}>Less</Text>
          <Box w={cellSize} h={cellSize} style={{ backgroundColor: getActivityColor(0), borderRadius: '2px' }} />
          <Box w={cellSize} h={cellSize} style={{ backgroundColor: getActivityColor(1), borderRadius: '2px' }} />
          <Box w={cellSize} h={cellSize} style={{ backgroundColor: getActivityColor(2), borderRadius: '2px' }} />
          <Box w={cellSize} h={cellSize} style={{ backgroundColor: getActivityColor(3), borderRadius: '2px' }} />
          <Box w={cellSize} h={cellSize} style={{ backgroundColor: getActivityColor(4), borderRadius: '2px' }} />
          <Text size="sm" fw={500}>More</Text>
        </Group>
      </Box>
    );
  };

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="lg">
        <Text size="lg" fw={500}>Contribution Activity</Text>
      </Group>
      
      {loading ? (
        <Text>Loading activity data...</Text>
      ) : (
        <Box>
          {renderGraph()}
          
          {/* TODO: Implement fetching and displaying actual contribution data */}
          {/* This can be connected to backend endpoints that track user activity */}
        </Box>
      )}
    </Paper>
  );
} 