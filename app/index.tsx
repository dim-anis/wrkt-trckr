import { Text } from '@/components/Text';
import { Box } from '@/components/Box';
import Link from '@/components/Link';
import React, { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

export default function MainScreen() {
  return (
    <Box bg="background" flex={1} justifyContent="center" padding="m">
      <Box flexDirection="column" gap="m">
        <Link href="/(screens)/categories" asChild>
          <Pressable>
            <Text variant="buttonLabel" color="primaryForeground">
              Start workout
            </Text>
          </Pressable>
        </Link>
        <Link href="/(screens)/templates" variant="secondary" asChild>
          <Pressable>
            <Text variant="buttonLabel" color="secondaryForeground">
              Use template
            </Text>
          </Pressable>
        </Link>
      </Box>
    </Box>
  );
}
