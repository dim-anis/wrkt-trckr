import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider } from '@shopify/restyle';
import { theme, darkTheme } from '../lib/theme';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { SQLiteProvider } from 'expo-sqlite';
import { migrateDbIfNeeded } from '@/lib/db';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/Box';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)'
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider theme={colorScheme === 'dark' ? darkTheme : theme}>
      <SQLiteProvider databaseName="user.db" onInit={migrateDbIfNeeded}>
        <Stack
          initialRouteName="index"
          screenOptions={{
            headerRight: () => (
              <Box flexDirection="row" gap="s">
                <Ionicons name="qr-code-outline" color="white" size={20} />
              </Box>
            ),
            headerTitle: 'WrktTrckr',
            headerStyle: {
              backgroundColor:
                colorScheme === 'dark'
                  ? darkTheme.colors.background
                  : theme.colors.background
            },
            headerTintColor:
              colorScheme === 'dark'
                ? darkTheme.colors.primary
                : theme.colors.primary
          }}
        >
          <Stack.Screen name="categories" />
          <Stack.Screen name="templates" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
