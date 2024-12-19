import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import { ComponentProps, useEffect, useMemo } from 'react';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';
import { Box } from './Box';

export default function Skeleton({
  style
}: ComponentProps<typeof Animated.View>) {
  const opacity = useSharedValue(1);
  const theme = useTheme<Theme>();

  const animationConfig = useMemo(
    () => ({
      opacity: withRepeat(
        withTiming(0.5, { duration: 1000 }),
        -1, // Repeat infinitely
        true // Reverse the animation (0.5 -> 1)
      )
    }),
    []
  );

  useEffect(() => {
    opacity.value = animationConfig.opacity;
  }, [animationConfig]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor: theme.colors.secondary,
    borderRadius: 6
  }));

  // return <Animated.View style={[animatedStyle, style]} />;

  return (
    <Box padding="m" gap="xl">
      <Box gap="m">
        <Box gap="m">
          <Animated.View style={[animatedStyle, { height: 40 }]} />
          <Box gap="m">
            <Animated.View style={[animatedStyle, { height: 20 }]} />
            <Animated.View style={[animatedStyle, { height: 40 }]} />
          </Box>
        </Box>
        <Box gap="m">
          <Box gap="s" flexDirection="row">
            <Animated.View
              style={[animatedStyle, { height: 40, width: 40, flex: 1 }]}
            />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View
              style={{
                height: 40,
                width: 40,
                flex: 1
              }}
            />
          </Box>
          <Box gap="s" flexDirection="row">
            <Animated.View
              style={[animatedStyle, { height: 40, width: 40, flex: 1 }]}
            />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View
              style={{
                height: 40,
                width: 40,
                flex: 1
              }}
            />
          </Box>
          <Box gap="s" flexDirection="row">
            <Animated.View
              style={[animatedStyle, { height: 40, width: 40, flex: 1 }]}
            />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View
              style={{
                height: 40,
                width: 40,
                flex: 1
              }}
            />
          </Box>
        </Box>
        <Animated.View style={[animatedStyle, { height: 40 }]} />
      </Box>
      <Box gap="m">
        <Box gap="m">
          <Animated.View style={[animatedStyle, { height: 40 }]} />
          <Box gap="m">
            <Animated.View style={[animatedStyle, { height: 20 }]} />
            <Animated.View style={[animatedStyle, { height: 40 }]} />
          </Box>
        </Box>
        <Box gap="m">
          <Box gap="s" flexDirection="row">
            <Animated.View
              style={[animatedStyle, { height: 40, width: 40, flex: 1 }]}
            />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View
              style={{
                height: 40,
                width: 40,
                flex: 1
              }}
            />
          </Box>
          <Box gap="s" flexDirection="row">
            <Animated.View
              style={[animatedStyle, { height: 40, width: 40, flex: 1 }]}
            />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View
              style={{
                height: 40,
                width: 40,
                flex: 1
              }}
            />
          </Box>
          <Box gap="s" flexDirection="row">
            <Animated.View
              style={[animatedStyle, { height: 40, width: 40, flex: 1 }]}
            />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View
              style={{
                height: 40,
                width: 40,
                flex: 1
              }}
            />
          </Box>
        </Box>
        <Animated.View style={[animatedStyle, { height: 40 }]} />
      </Box>
      <Box gap="m">
        <Box gap="m">
          <Animated.View style={[animatedStyle, { height: 40 }]} />
          <Box gap="m">
            <Animated.View style={[animatedStyle, { height: 20 }]} />
            <Animated.View style={[animatedStyle, { height: 40 }]} />
          </Box>
        </Box>
        <Box gap="m">
          <Box gap="s" flexDirection="row">
            <Animated.View
              style={[animatedStyle, { height: 40, width: 40, flex: 1 }]}
            />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View
              style={{
                height: 40,
                width: 40,
                flex: 1
              }}
            />
          </Box>
          <Box gap="s" flexDirection="row">
            <Animated.View
              style={[animatedStyle, { height: 40, width: 40, flex: 1 }]}
            />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View
              style={{
                height: 40,
                width: 40,
                flex: 1
              }}
            />
          </Box>
          <Box gap="s" flexDirection="row">
            <Animated.View
              style={[animatedStyle, { height: 40, width: 40, flex: 1 }]}
            />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View style={[animatedStyle, { height: 40, flex: 2 }]} />
            <Animated.View
              style={{
                height: 40,
                width: 40,
                flex: 1
              }}
            />
          </Box>
        </Box>
        <Animated.View style={[animatedStyle, { height: 40 }]} />
      </Box>
    </Box>
  );
}
