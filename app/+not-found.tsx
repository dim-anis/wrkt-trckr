import { Stack } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Box } from '@/components/ui/Box';
import Link from '@/components/ui/Link';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Box bg="background" flex={1}>
        <Text color="primary">This screen doesn't exist.</Text>

        <Link href="/" variant="secondary">
          <Text variant="buttonLabel" color="secondaryForeground">
            Go to home screen!
          </Text>
        </Link>
      </Box>
    </>
  );
}
