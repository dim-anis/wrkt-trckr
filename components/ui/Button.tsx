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
import { Pressable } from 'react-native';
import { Box } from './Box';

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
  label: string;
  onPress?: () => void;
};

export default function Button({ onPress, label, ...rest }: ButtonProps) {
  const props = useRestyle(restyleFunctions, rest);

  return (
    <Pressable onPress={onPress}>
      <Box {...props}>
        <Text variant="buttonLabel" labelVariant={rest.variant}>
          {label}
        </Text>
      </Box>
    </Pressable>
  );
}
