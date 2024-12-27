import { Box } from '@/components/ui/Box';
import { Theme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Stack } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

export default function Layout() {
  const theme = useTheme<Theme>();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.primary,
        title: 'Statistics',
        headerShadowVisible: false,
        headerRight: () => (
          <Box
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
            gap="m"
          >
            <Pressable hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
              <Ionicons
                name="ellipsis-vertical-outline"
                size={20}
                color={theme.colors.primary}
              />
            </Pressable>
          </Box>
        )
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
