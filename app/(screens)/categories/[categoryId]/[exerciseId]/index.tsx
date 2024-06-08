import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useLocalSearchParams } from 'expo-router';

export default function AddSet() {
  const { exerciseId } = useLocalSearchParams();

  return (
    <Box padding="m" backgroundColor="background" flex={1}>
      <Text variant="header" color="primary">
        {`Set form for exercise with ID: ${exerciseId}`}
      </Text>
    </Box>
  );
}
