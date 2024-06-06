import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';

export default function ModalScreen() {
  return (
    <Box bg="background" flex={1}>
      {/* <ModalContent path="app/modal.tsx" /> */}
      <Text color="input" variant="header">
        Modal Content
      </Text>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </Box>
  );
}
