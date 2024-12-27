import { Text } from '@/components/ui/Text';
import { Box } from '@/components/ui/Box';
import { Link as ExpoLink, Stack, useFocusEffect } from 'expo-router';
import { ColorSchemeName, Pressable, ScrollView } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';
import { Radio } from '@/components/ui/Radio';
import React from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { UserSettings, TMenuItem } from '@/types';
import { Appearance } from 'react-native';
import MenuItem from '@/components/MenuItem';
import { Ionicons } from '@expo/vector-icons';

const settingsMenu: TMenuItem[] = [
  {
    id: 'general',
    label: 'Feature settings',
    menuItems: [
      {
        id: 'body-metrics',
        label: 'Body metrics',
        href: '/settings/bodyMetrics',
        icon: 'body-outline'
      }
      // {
      //   id: 'meso',
      //   label: 'Mesocycle',
      //   href: '/screens/settings',
      //   icon: 'analytics-outline'
      // },
      // {
      //   id: 'progression',
      //   label: 'Progression',
      //   href: '/screens/settings',
      //   icon: 'bar-chart-outline'
      // },
      // {
      //   id: 'overloading',
      //   label: 'Overloading scheme',
      //   href: '/screens/settings',
      //   icon: 'analytics-outline'
      // }
    ]
  },
  {
    id: 'data',
    label: 'Data',
    menuItems: [
      {
        id: 'export',
        label: 'Export',
        href: '/settings/exportData',
        icon: 'cloud-upload-outline'
      },
      {
        id: 'import',
        label: 'Import',
        href: '/settings/importData',
        icon: 'download-outline'
      }
    ]
  }
];

const defaultSettings: UserSettings = {
  is_metric: 1,
  is_dark: null
};

const weightUnitRadioItems = [
  { value: 0, label: 'Pounds' },
  { value: 1, label: 'Kilograms' }
] as const;

const themeRadioItems = [
  { value: 0, label: 'Light' },
  { value: 1, label: 'Dark' },
  { value: null, label: 'System' }
] as const;

type ThemeOption = (typeof themeRadioItems)[number]['value'];
type WeightUnitOption = (typeof weightUnitRadioItems)[number]['value'];

const borderStyles = {
  borderBottomWidth: 1,
  borderBottomColor: 'mutedForeground'
} as const;

export default function Settings() {
  const theme = useTheme<Theme>();

  const [userSettings, setUserSettings] =
    React.useState<UserSettings>(defaultSettings);

  const db = useSQLiteContext();

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchSets = async () => {
        try {
          const result = await db.getFirstAsync<UserSettings>(
            `SELECT * FROM user_settings ORDER BY id ASC LIMIT 1;`
          );

          if (result) {
            setUserSettings(result);
          }
        } catch (error) {}
      };

      fetchSets();

      return () => {
        isActive = false;
      };
    }, [db])
  );

  function handleThemeChange(option: ThemeOption) {
    let theme: ColorSchemeName;
    if (option === 0 || option === 1) {
      theme = option === 1 ? 'dark' : 'light';
    } else {
      theme = option;
    }

    Appearance.setColorScheme(theme);

    setUserSettings({ ...userSettings, is_dark: option });

    db.withTransactionAsync(async () => {
      await db.runAsync(`UPDATE user_settings SET is_dark = ?;`, option);
    });
  }

  function handleWeightUnitChange(option: WeightUnitOption) {
    setUserSettings({ ...userSettings, is_metric: option });

    db.withTransactionAsync(async () => {
      await db.runAsync(`UPDATE user_settings SET is_metric = ?;`, option);
    });
  }

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1
      }}
      style={{ backgroundColor: theme.colors.background }}
    >
      <Box padding="m" backgroundColor="background" flex={1} gap="l">
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Settings'
          }}
        />
        {settingsMenu.map(({ id, label, menuItems }) => {
          return (
            <Box key={id} gap="m">
              <Text variant="header2" color="primary">
                {label}
              </Text>
              <Box
                paddingHorizontal="m"
                borderRadius="lg"
                backgroundColor="muted"
              >
                {menuItems &&
                  menuItems.map((item, idx) => {
                    return (
                      <ExpoLink key={idx} href={item.href!} asChild>
                        <Pressable>
                          <Box
                            paddingVertical="s"
                            {...(idx < menuItems.length - 1
                              ? borderStyles
                              : {})}
                          >
                            <MenuItem
                              label={item.label}
                              iconLeft={
                                <Ionicons
                                  name={item.icon}
                                  size={20}
                                  color={theme.colors.primary}
                                />
                              }
                              iconRight={
                                <Ionicons
                                  name="chevron-forward"
                                  size={20}
                                  color={theme.colors.primary}
                                />
                              }
                            />
                          </Box>
                        </Pressable>
                      </ExpoLink>
                    );
                  })}
              </Box>
            </Box>
          );
        })}

        <Box gap="m">
          <Text variant="header2" color="primary">
            Weight units
          </Text>
          <Box
            paddingHorizontal="m"
            paddingVertical="xs"
            borderRadius="lg"
            backgroundColor="muted"
          >
            {weightUnitRadioItems.map((item, idx) => (
              <Box
                key={idx}
                flexDirection="row"
                alignItems="center"
                paddingVertical="s"
                {...(idx < weightUnitRadioItems.length - 1 ? borderStyles : {})}
              >
                <Radio.Root
                  checked={userSettings?.is_metric === item.value}
                  onChange={() => handleWeightUnitChange(item.value)}
                  paddingVertical="s"
                  flexDirection="row"
                  flex={1}
                  justifyContent="space-between"
                  accessibilityLabel="radio button"
                >
                  <Radio.Label text={item.label} />
                  <Radio.Icon
                    checked={userSettings?.is_metric === item.value}
                  />
                </Radio.Root>
              </Box>
            ))}
          </Box>
        </Box>

        <Box gap="m">
          <Text variant="header2" color="primary">
            Theme
          </Text>
          <Box
            paddingHorizontal="m"
            paddingVertical="xs"
            borderRadius="lg"
            backgroundColor="muted"
          >
            {themeRadioItems.map((item, idx) => (
              <Box
                key={idx}
                flexDirection="row"
                alignItems="center"
                paddingVertical="s"
                {...(idx < themeRadioItems.length - 1 ? borderStyles : {})}
              >
                <Radio.Root
                  checked={userSettings?.is_dark === item.value}
                  onChange={() => handleThemeChange(item.value)}
                  paddingVertical="s"
                  flex={1}
                  flexDirection="row"
                  justifyContent="space-between"
                  accessibilityLabel="radio button"
                >
                  <Radio.Label text={item.label} />
                  <Radio.Icon checked={userSettings?.is_dark === item.value} />
                </Radio.Root>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </ScrollView>
  );
}
