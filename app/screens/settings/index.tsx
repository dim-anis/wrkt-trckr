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
        id: 'meso',
        label: 'Mesocycle',
        href: '/screens/settings',
        icon: 'analytics-outline'
      },

      {
        id: 'progression',
        label: 'Progression',
        href: '/screens/settings',
        icon: 'bar-chart-outline'
      },
      {
        id: 'overloading',
        label: 'Overloading scheme',
        href: '/screens/settings',
        icon: 'analytics-outline'
      }
    ]
  },

  {
    id: 'data',
    label: 'Data',
    menuItems: [
      {
        id: 'export',
        label: 'Export',
        href: '/screens/settings/exportData',
        icon: 'cloud-upload-outline'
      },
      {
        id: 'import',
        label: 'Import',
        href: '/screens/settings/importData',
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

// type WeightUnitValues = ValueOf<(typeof weightUnitRadioItems)[number]['value']>;

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
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Box padding="m" backgroundColor="background" flex={1} gap="l">
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Settings'
          }}
        />
        {settingsMenu.map(({ id, label, menuItems }) => (
          <Box key={id}>
            <Text variant="header2" color="primary">
              {label}
            </Text>
            <Box marginTop="m">
              {menuItems &&
                menuItems.map(item => (
                  <ExpoLink key={item.id} href={item.href!} asChild>
                    <Pressable>
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
                    </Pressable>
                  </ExpoLink>
                ))}
            </Box>
          </Box>
        ))}

        <Text variant="header2" color="primary">
          Weight units
        </Text>
        {weightUnitRadioItems.map(item => (
          <Radio.Root
            key={item.value}
            checked={userSettings?.is_metric === item.value}
            onChange={() => handleWeightUnitChange(item.value)}
            flexDirection="row"
            justifyContent="space-between"
            accessibilityLabel="radio button"
          >
            <Radio.Label text={item.label} />
            <Radio.Icon checked={userSettings?.is_metric === item.value} />
          </Radio.Root>
        ))}

        <Text variant="header2" color="primary">
          Theme
        </Text>
        {themeRadioItems.map(item => (
          <Radio.Root
            key={item.value}
            checked={userSettings?.is_dark === item.value}
            onChange={() => handleThemeChange(item.value)}
            flexDirection="row"
            justifyContent="space-between"
            accessibilityLabel="radio button"
          >
            <Radio.Label text={item.label} />
            <Radio.Icon checked={userSettings?.is_dark === item.value} />
          </Radio.Root>
        ))}
      </Box>
    </ScrollView>
  );
}
