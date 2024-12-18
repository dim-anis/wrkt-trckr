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
      <Stack.Screen name="categories/index" />
      <Stack.Screen name="template" />
      <Stack.Screen name="exercises/index" />
      <Stack.Screen name="search" />
      <Stack.Screen name="createExercise" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="stats" />
    </Stack>
  );
}
