import React from 'react';
import { Box } from './ui/Box';
import { Text } from './ui/Text';
import { Pressable } from 'react-native';
import type { WorkoutSet } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';
import Badge from './Badge';

type Props = {
  sets: WorkoutSet[];
  onSetSelected?: (set: WorkoutSet | undefined) => void;
  selectedSet?: WorkoutSet;
};

export default function SetList({ sets, selectedSet, onSetSelected }: Props) {
  const theme = useTheme<Theme>();

  function getRpeOptionColor(rpeValue: number) {
    if (rpeValue >= 9) {
      return theme.colors.red;
    }
    if (rpeValue >= 7.5) {
      return theme.colors.orange;
    }
    if (rpeValue >= 6.5) {
      return theme.colors.yellow;
    }

    return theme.colors.green;
  }

  return (
    <Box borderRadius="sm" borderColor="border" borderWidth={1}>
      <Box flexDirection="row" flexGrow={1}>
        <Box
          padding="s"
          borderBottomColor="border"
          borderBottomWidth={1}
          flexGrow={1}
        >
          <Text
            variant="body"
            fontWeight={500}
            color="mutedForeground"
            textAlign="left"
            verticalAlign="middle"
            paddingHorizontal="s"
          >
            {'Weight'}
          </Text>
        </Box>
        <Box
          padding="s"
          borderBottomColor="border"
          borderBottomWidth={1}
          flexGrow={1}
        >
          <Text
            variant="body"
            fontWeight={500}
            color="mutedForeground"
            textAlign="left"
            verticalAlign="middle"
            paddingHorizontal="s"
          >
            {'Repetitions'}
          </Text>
        </Box>
        <Box
          padding="s"
          borderBottomColor="border"
          borderBottomWidth={1}
          flexGrow={1}
        >
          <Text
            variant="body"
            verticalAlign="middle"
            fontWeight={500}
            color="mutedForeground"
            textAlign="right"
            paddingHorizontal="s"
          >
            {`RPE`}
          </Text>
        </Box>
      </Box>
      <Box>
        {sets.map((set, index) => (
          <Pressable
            key={index}
            onPress={() =>
              onSetSelected
                ? onSetSelected(set.id === selectedSet?.id ? undefined : set)
                : {}
            }
          >
            <Box
              flex={1}
              flexDirection="row"
              paddingHorizontal="s"
              backgroundColor={
                selectedSet?.id === set.id ? 'accent' : undefined
              }
            >
              <Box
                padding="s"
                borderBottomColor="border"
                borderBottomWidth={index + 1 === sets.length ? 0 : 1}
                flex={1}
              >
                <Box flexDirection="row" gap="s" alignItems="center">
                  <Text variant="body" color="primary">
                    {set.weight !== null ? `${set.weight} kg` : 'BW'}
                  </Text>
                  {set.added_resistance && (
                    <Badge label={`+${set.added_resistance} kg`} />
                  )}
                </Box>
              </Box>
              <Box
                padding="s"
                borderBottomColor="border"
                borderBottomWidth={index + 1 === sets.length ? 0 : 1}
                flex={1}
              >
                <Text variant="body" color="primary">
                  {`${set.reps}`}
                </Text>
              </Box>
              <Box
                padding="s"
                alignItems="flex-end"
                borderBottomColor="border"
                borderBottomWidth={index + 1 === sets.length ? 0 : 1}
                flex={1}
              >
                {set.rpe ? (
                  <Box flexDirection="row" alignItems="center" gap="s">
                    <Text variant="body" color="primary" textAlign="right">
                      {`${set.rpe}`}
                    </Text>
                    <Ionicons
                      name="ellipse"
                      color={getRpeOptionColor(set.rpe)}
                      size={8}
                    />
                  </Box>
                ) : (
                  <Text variant="body" color="primary" textAlign="right">
                    -
                  </Text>
                )}
              </Box>
            </Box>
          </Pressable>
        ))}
      </Box>
    </Box>
  );
}
