import { PropsWithChildren } from 'react';
import { Box } from './ui/Box';
import { Text } from './ui/Text';
import { Ionicons } from '@expo/vector-icons';
import Badge from './Badge';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';
import { Pressable } from 'react-native';

type Props = {
  exerciseName: string;
  exerciseStats?: {
    totalVolume?: number;
    averageRPE?: number;
  };
};

export default function ExerciseCard({
  exerciseName,
  exerciseStats,
  children
}: PropsWithChildren<Props>) {
  const theme = useTheme<Theme>();

  return (
    <Box borderWidth={1} borderColor="border" borderRadius="md">
      <Box padding="m" gap="m">
        <Box gap="s">
          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text variant="header3" color="primary" flex={1}>
              {exerciseName}
            </Text>
            <Pressable>
              <Ionicons
                name="chevron-forward"
                color={theme.colors.primary}
                size={20}
              />
            </Pressable>
          </Box>

          {exerciseStats && (
            <Box gap="s" flexDirection="row">
              {exerciseStats.totalVolume && exerciseStats.totalVolume > 0 ? (
                <Badge label={`${exerciseStats.totalVolume} kg`} />
              ) : null}
              {exerciseStats.averageRPE && exerciseStats.averageRPE > 0 ? (
                <Badge label={`${exerciseStats.averageRPE} RPE`} />
              ) : null}
            </Box>
          )}
        </Box>
        {children}
      </Box>
    </Box>
  );
}
