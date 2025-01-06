import { withLayoutContext } from 'expo-router';
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions
} from '@react-navigation/material-top-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';

const { Navigator } = createMaterialTopTabNavigator();
export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function TabLayout() {
  const theme = useTheme<Theme>();
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
      <MaterialTopTabs.Screen name="week" options={{ title: 'Week' }} />
      <MaterialTopTabs.Screen name="month" options={{ title: 'Month' }} />
    </MaterialTopTabs>
  );
}
