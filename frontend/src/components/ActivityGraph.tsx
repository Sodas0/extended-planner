import { Paper, Text, Group, Box, Tooltip, Skeleton } from '@mantine/core';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import axiosInstance from '@/utils/axios';
import { notifications } from '@mantine/notifications';

// Define the interface for activity data
interface ActivityData {
  date: string;
  count: number;
}

interface ActivityGraphProps {
  refreshTrigger?: number;
}

export default function ActivityGraph({ refreshTrigger = 0 }: ActivityGraphProps) {
  const [activityData, setActivityData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { themeConfig } = useTheme();
  
  // Simplified refresh logic - always fetch when refreshTrigger changes
  useEffect(() => {
    console.log(`ActivityGraph: Effect triggered with refreshTrigger=${refreshTrigger}`);
    fetchActivityData();
  }, [refreshTrigger]); 

  const fetchActivityData = async () => {
    try {
      // Cache busting with unique timestamp
      const timestamp = Date.now();
      console.log(`Fetching activity data (${timestamp})`);
      
      // Check if there's a token
      const token = localStorage.getItem('token');
      console.log('Has authentication token:', !!token);
      
      // Get today's date in YYYY-MM-DD format for consistent comparison
      const today = new Date().toISOString().split('T')[0];
      console.log('Current local date (YYYY-MM-DD):', today);
      
      // Add timestamp and today parameter to ensure we get fresh data with correct date handling
      // This helps backend correctly identify today's date regardless of timezone issues
      const response = await axiosInstance.get(`/users/me/activity?_=${timestamp}&today=${today}`);
      console.log('Activity data response status:', response.status);
      console.log('Activity data received:', response.data);
      
      if (response.data && typeof response.data === 'object') {
        // Count how many days have activity
        const activeDays = Object.entries(response.data).filter(([_, count]) => (count as number) > 0);
        console.log(`Found ${activeDays.length} days with activity`);
        
        // Check if today is in the data
        console.log(`Today (${today}) in data:`, today in response.data);
        console.log(`Today's activity count:`, response.data[today] || 0);
        
        // Remove any cached data and directly use the response
        setActivityData({...response.data});
        
        // Log all dates with activity
        if (activeDays.length > 0) {
          console.log("Days with activity:");
          activeDays.forEach(([date, count]) => {
            console.log(`  ${date}: ${count} tasks`);
          });
        } else {
          console.log("No days with activity found!");
        }
        
        // Log the 5 most recent days
        const recentDates = Object.keys(response.data).sort().slice(-5);
        console.log('Recent dates activity:', recentDates.map(date => ({
          date,
          count: response.data[date]
        })));
      } else {
        console.error('Invalid activity data format:', response.data);
        notifications.show({
          title: 'Error',
          message: 'Invalid activity data format',
          color: 'red',
        });
        generateRandomActivityData();
      }
    } catch (error: any) {
      console.error('Error fetching activity data:', error);
      if (error.response) {
        console.error('Error details:', error.response.status, error.response.data);
      }
      notifications.show({
        title: 'Error',
        message: 'Failed to load activity data',
        color: 'red',
      });
      generateRandomActivityData();
    } finally {
      setLoading(false);
    }
  };

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
  };

  const getActivityColor = (count: number) => {
    // Normalize count to be between 0 and 4 for coloring
    const normalizedCount = Math.min(Math.max(count, 0), 4);
    // Get color index (0-4)
    const colorIndex = count === 0 ? 0 : Math.ceil(normalizedCount);
    return themeConfig.colors.activity[colorIndex as keyof typeof themeConfig.colors.activity];
  };

  const renderGraph = () => {
    // Get days of the week (0 = Sunday, 1 = Monday, ...)
    const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
    
    // Generate dates for the last 365 days (most recent last)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log(`Today's date: ${todayStr}, activity count: ${activityData[todayStr] || 0}`);
    
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
                          label={`${count} ${count === 1 ? 'Task Completed' : 'Tasks Completed'} on ${formattedDate}`}
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
          <Text size="sm" fw={500}>Fewer</Text>
          <Box w={cellSize} h={cellSize} style={{ backgroundColor: getActivityColor(0), borderRadius: '2px' }} />
          <Box w={cellSize} h={cellSize} style={{ backgroundColor: getActivityColor(1), borderRadius: '2px' }} />
          <Box w={cellSize} h={cellSize} style={{ backgroundColor: getActivityColor(2), borderRadius: '2px' }} />
          <Box w={cellSize} h={cellSize} style={{ backgroundColor: getActivityColor(3), borderRadius: '2px' }} />
          <Box w={cellSize} h={cellSize} style={{ backgroundColor: getActivityColor(4), borderRadius: '2px' }} />
          <Text size="sm" fw={500}>More Tasks Completed</Text>
        </Group>
      </Box>
    );
  };

  return (
    <>
      {loading ? (
        <Box>
          <Skeleton height={120} radius="md" mb="sm" />
          <Skeleton height={30} radius="md" width="60%" mx="auto" />
        </Box>
      ) : (
        <Box key={`activity-graph-${refreshTrigger}`}>
          {renderGraph()}
        </Box>
      )}
    </>
  );
} 