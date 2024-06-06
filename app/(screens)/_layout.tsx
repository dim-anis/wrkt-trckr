import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="select-category" />
      <Stack.Screen name="use-template" />
    </Stack>
  );
}
