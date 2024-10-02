import { Box } from '@/components/ui/Box';
import { Stack } from 'expo-router';

export default function ImportData() {
  return (
    <Box padding="m" backgroundColor="background" flex={1} gap="l">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Import data'
        }}
      />
    </Box>
  );
}
