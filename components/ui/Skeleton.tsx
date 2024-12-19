import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import { ComponentProps, useEffect } from 'react';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';

export default function Skeleton({
  style
}: ComponentProps<typeof Animated.View>) {
  const opacity = useSharedValue(1);
  const theme = useTheme<Theme>();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.5, { duration: 1000 }),
      -1, // Repeat infinitely
      true // Reverse the animation (0.5 -> 1)
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      backgroundColor: theme.colors.secondary,
      borderRadius: 6
    };
  });

  return <Animated.View style={[animatedStyle, style]} />;
}
