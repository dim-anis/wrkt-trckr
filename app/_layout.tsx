import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider } from '@shopify/restyle';
import { useFonts } from 'expo-font';
import { Stack, useFocusEffect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { PropsWithChildren, useEffect } from 'react';
import 'react-native-reanimated';
import { darkTheme, theme } from '../lib/theme';
import * as SystemUI from 'expo-system-ui';

import { useColorScheme } from '@/components/useColorScheme';
import { migrateDbIfNeeded } from '@/lib/db';
import { UserSettings } from '@/types';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import React from 'react';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index'
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
  return (
    <Providers>
      <Stack initialRouteName="index">
        <Stack.Screen name="index" />
        <Stack.Screen name="template" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
        <Stack.Screen name="createExercise" options={{ headerShown: false }} />
        <Stack.Screen name="createCategory" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="stats" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}

function Providers({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName="user.db" onInit={migrateDbIfNeeded}>
      <ThemeProviderWithPreference>
        <GestureHandlerRootView>
          <BottomSheetModalProvider>
            {children}
            <FlashMessage position="bottom" />
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </ThemeProviderWithPreference>
    </SQLiteProvider>
  );
}

function ThemeProviderWithPreference({ children }: PropsWithChildren) {
  let colorScheme = useColorScheme();
  const [themePreference, setThemePreference] =
    React.useState<Pick<UserSettings, 'is_dark'>>();

  const db = useSQLiteContext();

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchSets = async () => {
        try {
          const result = await db.getFirstAsync<Pick<UserSettings, 'is_dark'>>(
            `SELECT is_dark FROM user_settings ORDER BY id ASC LIMIT 1;`
          );

          if (result) {
            setThemePreference(result);
          }
        } catch (error) {}
      };

      fetchSets();

      return () => {
        isActive = false;
      };
    }, [db])
  );

  if (themePreference) {
    if (themePreference.is_dark === null) {
      colorScheme = colorScheme;
    } else {
      colorScheme = themePreference.is_dark === 1 ? 'dark' : 'light';
    }
  } else {
    colorScheme = colorScheme;
  }

  const preferredTheme = colorScheme === 'dark' ? darkTheme : theme;
  const statusBarStyle = colorScheme === 'light' ? 'dark' : 'light';

  SystemUI.setBackgroundColorAsync(preferredTheme.colors.background);

  return (
    <ThemeProvider theme={preferredTheme}>
      <StatusBar
        style={statusBarStyle}
        backgroundColor={preferredTheme.colors.background}
      />
      {children}
    </ThemeProvider>
  );
}
