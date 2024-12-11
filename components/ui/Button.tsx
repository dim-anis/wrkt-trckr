import { Theme } from '@/lib/theme';
import { Text } from './Text';
import {
  createVariant,
  VariantProps,
  color,
  backgroundColor,
  border,
  ColorProps,
  BackgroundColorProps,
  BorderProps,
  useRestyle,
  spacing,
  SpacingProps,
  composeRestyleFunctions,
  layout,
  LayoutProps
} from '@shopify/restyle';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { Box } from './Box';
import { ReactElement } from 'react';

type RestyleProps = SpacingProps<Theme> &
  ColorProps<Theme> &
  BorderProps<Theme> &
  LayoutProps<Theme> &
  BackgroundColorProps<Theme> &
  VariantProps<Theme, 'buttonVariants'>;

const restyleFunctions = composeRestyleFunctions<Theme, RestyleProps>([
  layout,
  color,
  spacing,
  border,
  backgroundColor,
  createVariant<Theme, 'buttonVariants'>({
    themeKey: 'buttonVariants'
  })
]);

type ButtonProps = RestyleProps & {
  label?: string;
  icon?: ReactElement;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function Button({
  onPress,
  label,
  icon,
  style,
  disabled = false,
  ...rest
}: ButtonProps) {
  const props = useRestyle(restyleFunctions, rest);

  return (
    <Pressable onPress={onPress} style={style} disabled={disabled}>
      <Box
        gap="m"
        flexDirection="row"
        opacity={disabled ? 0.5 : undefined}
        pointerEvents={disabled ? 'none' : 'auto'}
        {...props}
      >
        {icon && icon}
        {label && (
          <Text variant="buttonLabel" labelVariant={rest.variant}>
            {label}
          </Text>
        )}
      </Box>
    </Pressable>
  );
}
