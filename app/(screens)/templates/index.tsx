import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { Stack } from 'expo-router';
import React from 'react';

export default function UseTemplate() {
  return (
    <Box padding="m" flex={1} backgroundColor="background">
      <Text variant={'header'} color="primary">
        Use template
      </Text>
    </Box>
  );
}
