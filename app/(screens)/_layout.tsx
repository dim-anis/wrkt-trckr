import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="categories" options={{ title: 'Select category' }} />
      <Stack.Screen name="templates" options={{ title: 'Select template' }} />
    </Stack>
  );
}
