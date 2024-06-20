import { Theme } from '@/lib/theme';
import { Text } from './Text';
import {
  createVariant,
  createRestyleComponent,
  TypographyProps,
  VariantProps,
  color,
  backgroundColor,
  typography,
  border,
  ColorProps,
  BackgroundColorProps,
  BorderProps,
  useRestyle,
  spacing,
  SpacingProps,
  composeRestyleFunctions
} from '@shopify/restyle';
import { Button as DefaultButton, Pressable } from 'react-native';
import { Box } from './Box';

type RestyleProps = SpacingProps<Theme> &
  ColorProps<Theme> &
  BorderProps<Theme> &
  BackgroundColorProps<Theme> &
  VariantProps<Theme, 'buttonVariants'>;

const restyleFunctions = composeRestyleFunctions<Theme, RestyleProps>([
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
  onPress: () => void;
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
