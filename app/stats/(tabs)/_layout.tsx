import { useLocalSearchParams, withLayoutContext } from 'expo-router';
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions
} from '@react-navigation/material-top-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';
import { toDateId } from '@marceloterreiro/flash-calendar';
import { endOfWeek, startOfWeek, subDays } from 'date-fns';

const { Navigator } = createMaterialTopTabNavigator();
export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

type SearchParams = {
  dateRangeFrom: string;
};

export default function TabLayout() {
  const theme = useTheme<Theme>();
  const { dateRangeFrom } = useLocalSearchParams<SearchParams>();

  return (
    <MaterialTopTabs
      initialRouteName="day"
      sceneContainerStyle={{ backgroundColor: theme.colors.background }}
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarIndicatorStyle: { backgroundColor: theme.colors.primary },
        tabBarStyle: { backgroundColor: theme.colors.background },
        tabBarLabelStyle: {
          fontWeight: 'bold',
          textTransform: 'capitalize',
          fontSize: 14
        }
      }}
    >
      <MaterialTopTabs.Screen name="day" options={{ title: 'Day' }} />
      <MaterialTopTabs.Screen
        name="week"
        options={{ title: 'Week' }}
        initialParams={{
          dateRangeFrom: toDateId(
            startOfWeek(dateRangeFrom, { weekStartsOn: 1 })
          ),
          dateRangeTo: toDateId(endOfWeek(dateRangeFrom, { weekStartsOn: 1 }))
        }}
      />
      <MaterialTopTabs.Screen
        name="month"
        options={{ title: 'Month' }}
        initialParams={{
          dateRangeFrom: toDateId(subDays(dateRangeFrom, 27)),
          dateRangeTo: dateRangeFrom
        }}
      />
    </MaterialTopTabs>
  );
}
