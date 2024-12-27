import { Theme } from '@/lib/theme';
import { useTheme } from '@shopify/restyle';
import { Stack } from 'expo-router';
import React from 'react';

export default function Layout() {
  const theme = useTheme<Theme>();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.primary
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
