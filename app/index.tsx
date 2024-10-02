import MenuItem from '@/components/MenuItem';
import StatsCard from '@/components/StatsCard';
import WorkoutList from '@/components/WorkoutList';
import { Box } from '@/components/ui/Box';
import Link from '@/components/ui/Link';
import { Modal, useModal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { Theme } from '@/lib/theme';
import { getAverageRPE, getTotalVolume } from '@/lib/utils';
import type { SetWithExerciseData, TMenuItem } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { toDateId } from '@marceloterreiro/flash-calendar';
import { useTheme } from '@shopify/restyle';
import { addDays, format, isToday, subDays } from 'date-fns';
import {
  Link as ExpoLink,
  Stack,
  useFocusEffect,
  useLocalSearchParams
} from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React from 'react';
import { Pressable } from 'react-native';

const menuItems: TMenuItem[] = [
  {
    id: 'settings-statistics',
    href: '/screens/settings',
    label: 'Statistics',
    icon: 'stats-chart-outline'
  },
  {
    id: 'settings-tracker',
    href: '/screens/settings',
    label: 'Body tracker',
    icon: 'body-outline'
  },
  {
    id: 'settings-share',
    href: '/screens/settings',
    label: 'Share workout',
    icon: 'share-social-outline'
  },
  {
    id: 'settings',
    href: '/screens/settings',
    label: 'Copy workout',
    icon: 'copy-outline'
  },
  {
    id: 'settings',
    href: '/screens/settings',
    label: 'Delete workout',
    icon: 'trash-outline'
  },
  {
    id: 'settings',
    href: '/screens/settings',
    label: 'Settings',
    icon: 'settings-outline'
  }
];

export default function MainScreen() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const { dateId } = useLocalSearchParams();
  const today = toDateId(new Date());

  const [currentDate, setCurrentDate] = React.useState(
    (dateId as string) || today
  );
  const [sets, setSets] = React.useState<SetWithExerciseData[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchSets = async () => {
        try {
          const result = await db.getAllAsync<SetWithExerciseData>(
            `SELECT sets.*, exercises.name as exerciseName
             FROM sets
             INNER JOIN exercises ON sets.exercise_id = exercises.id
             WHERE DATE(sets.created_at) = '${currentDate}';`
          );

          if (result) {
            setSets(result);
          }
        } catch (error) {}
      };

      fetchSets();

      return () => {
        isActive = false;
      };
    }, [db, currentDate])
  );

  const {
    present: presentMore,
    dismiss: dismissMore,
    ref: refMore
  } = useModal();

  return (
    <Box bg="background" flex={1} justifyContent="center" padding="m" gap="l">
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              gap="s"
            >
              <Pressable
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                onPress={() =>
                  setCurrentDate(toDateId(subDays(currentDate, 1)))
                }
              >
                <Ionicons
                  name="chevron-back"
                  color={theme.colors.primary}
                  size={24}
                />
              </Pressable>
              <Text variant="header2" color="primary">
                {isToday(currentDate)
                  ? 'Today'
                  : format(currentDate, 'MMM, dd')}
              </Text>
              <Pressable
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                onPress={() =>
                  setCurrentDate(toDateId(addDays(currentDate, 1)))
                }
              >
                <Ionicons
                  name="chevron-forward"
                  color={theme.colors.primary}
                  size={24}
                />
              </Pressable>
            </Box>
          ),
          headerRight: () => (
            <Box flexDirection="row" gap="m">
              <Pressable
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                onPress={() => setCurrentDate(today)}
              >
                <Ionicons
                  name="calendar-number-outline"
                  color={theme.colors.primary}
                  size={20}
                />
              </Pressable>
              <ExpoLink href="/calendarView" asChild>
                <Pressable
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <Ionicons
                    name="calendar"
                    color={theme.colors.primary}
                    size={20}
                  />
                </Pressable>
              </ExpoLink>
              <Pressable
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                onPress={presentMore}
              >
                <Ionicons
                  name="ellipsis-vertical"
                  color={theme.colors.primary}
                  size={20}
                />
              </Pressable>
            </Box>
          ),
          headerTitle: '',
          headerStyle: {
            backgroundColor: theme.colors.background
          },
          headerTintColor: theme.colors.primary
        }}
      />

      {sets.length > 0 && (
        <Box flexDirection="row" gap="xs">
          <StatsCard
            title="Total volume"
            value={getTotalVolume(sets)}
            unit={'kg'}
          />
          <StatsCard title="Average RPE" value={getAverageRPE(sets)} />
        </Box>
      )}

      <WorkoutList data={sets} />

      {sets.length > 0 ? (
        <Box
          position="absolute"
          aspectRatio={'1/1'}
          width={48}
          right={25}
          bottom={25}
        >
          <Link
            href={{
              pathname: '/screens/categories',
              params: {
                timestamp: new Date(sets.at(-1)?.created_at!).toISOString()
              }
            }}
            flexGrow={1}
            asChild
          >
            <Pressable>
              <Ionicons
                name="add-outline"
                size={24}
                color={theme.colors.primaryForeground}
              />
            </Pressable>
          </Link>
        </Box>
      ) : (
        <Box flexDirection="row" gap="m">
          <Link href="/screens/categories" flexGrow={1} asChild>
            <Pressable>
              <Text variant="buttonLabel" color="primaryForeground">
                Start workout
              </Text>
            </Pressable>
          </Link>
          <Link
            href="/screens/template"
            flexGrow={1}
            variant="secondary"
            asChild
          >
            <Pressable>
              <Text variant="buttonLabel" color="secondaryForeground">
                Use template
              </Text>
            </Pressable>
          </Link>
        </Box>
      )}
      <Modal
        ref={refMore}
        title="More"
        enableDynamicSizing
        snapPoints={[]}
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        <BottomSheetView>
          <Box padding="m" gap="m">
            {menuItems.map(({ href, label, icon }, index) => (
              <ExpoLink key={index} href={href} onPress={dismissMore}>
                <MenuItem label={label} icon={icon} />
              </ExpoLink>
            ))}
          </Box>
        </BottomSheetView>
      </Modal>
    </Box>
  );
}
