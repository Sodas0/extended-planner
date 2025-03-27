import { Modal, Text, Group, Box, Stack, Select } from '@mantine/core';
import { useTheme, ColorScheme } from '@/hooks/useTheme';
import { 
  IconSun, 
  IconMoonStars, 
  IconPalette
} from '@tabler/icons-react';
import { ReactNode } from 'react';

interface SettingsModalProps {
  opened: boolean;
  onClose: () => void;
}

interface ThemeOption {
  value: ColorScheme;
  label: string;
  icon: ReactNode;
}

export default function SettingsModal({ opened, onClose }: SettingsModalProps) {
  const { colorScheme, setColorScheme, themeConfig } = useTheme();

  const themeOptions: ThemeOption[] = [
    { 
      value: 'light', 
      label: 'Light', 
      icon: <IconSun size={18} />,
     
    },
    { 
      value: 'dark', 
      label: 'Dark', 
      icon: <IconMoonStars size={18} />,
      
    },
    { 
      value: 'blue', 
      label: 'Blue', 
      icon: <IconPalette size={18} />,
    }
  ];

  // Get icon for selected theme
  const getThemeIcon = () => {
    const theme = themeOptions.find(t => t.value === colorScheme);
    return theme?.icon || <IconSun size={18} />;
  };

  // Custom styles for better contrast regardless of theme
  const modalTitleStyle = {
    color: themeConfig.colors.text.primary,
    fontWeight: 700,
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title="Settings" 
      centered
      overlayProps={{
        backgroundOpacity: 0.7,
        blur: 3,
      }}
      styles={{
        title: { ...modalTitleStyle },
        header: { backgroundColor: themeConfig.colors.background.paper },
        content: { backgroundColor: themeConfig.colors.background.paper }
      }}
    >
      <Stack>
        <Box>
          <Text fw={700} size="sm" mb="xs" c={themeConfig.colors.text.primary}>Theme</Text>
          <Select
            value={colorScheme}
            onChange={(value) => value && setColorScheme(value as ColorScheme)}
            data={themeOptions.map(theme => ({
              value: theme.value,
              label: theme.label
            }))}
            leftSection={getThemeIcon()}
            styles={{
              input: { 
                color: themeConfig.colors.text.primary,
                fontWeight: 500,
                backgroundColor: themeConfig.colors.background.paper
              },
              dropdown: {
                backgroundColor: themeConfig.colors.background.paper
              },
              option: {
                color: themeConfig.colors.text.primary,
                '&:hover': {
                  backgroundColor: colorScheme === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)'
                }
              }
            }}
          />
        </Box>
      </Stack>
    </Modal>
  );
} 