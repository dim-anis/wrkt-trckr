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
        <Link href="/select-category" variant="primary" asChild>
          <Pressable>
            <Text variant="buttonLabel" color="input">
              Start workout
            </Text>
          </Pressable>
        </Link>
        <Link href="/use-template" variant="secondary" asChild>
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
