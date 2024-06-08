import { Theme } from '@/lib/theme';
import {
  createVariant,
  createRestyleComponent,
  TypographyProps,
  VariantProps,
  color,
  backgroundColor,
  typography,
  layout,
  border,
  ColorProps,
  BackgroundColorProps,
  LayoutProps,
  BorderProps
} from '@shopify/restyle';
import { Button as DefaultButton } from 'react-native';

const Button = createRestyleComponent<
  VariantProps<Theme, 'buttonVariants'> &
    ColorProps<Theme> &
    BackgroundColorProps<Theme> &
    TypographyProps<Theme> &
    LayoutProps<Theme> &
    BorderProps<Theme> &
    React.ComponentProps<typeof DefaultButton>,
  Theme
>(
  [
    color,
    backgroundColor,
    typography,
    layout,
    border,
    createVariant<Theme, 'buttonVariants'>({
      themeKey: 'buttonVariants'
    })
  ],
  DefaultButton
);

export default Button;
