import { Theme } from '@/lib/theme';
import {
  ColorProps,
  LayoutProps,
  OpacityProps,
  SpacingProps,
  TextShadowProps,
  TypographyProps,
  VariantProps,
  VisibleProps,
  color,
  createRestyleComponent,
  createVariant,
  layout,
  opacity,
  spacing,
  textShadow,
  typography,
  visible
} from '@shopify/restyle';
import React from 'react';
import { Text as DefaultText } from 'react-native';

export const Text = createRestyleComponent<
  ColorProps<Theme> &
    OpacityProps<Theme> &
    VisibleProps<Theme> &
    TypographyProps<Theme> &
    TextShadowProps<Theme> &
    SpacingProps<Theme> &
    LayoutProps<Theme> &
    VariantProps<Theme, 'textVariants'> &
    VariantProps<Theme, 'buttonLabelVariants', 'labelVariant'> &
    React.ComponentProps<typeof DefaultText>,
  Theme
>(
  [
    createVariant<Theme, 'buttonLabelVariants', 'labelVariant'>({
      themeKey: 'buttonLabelVariants',
      property: 'labelVariant'
    }),
    createVariant<Theme, 'textVariants'>({
      themeKey: 'textVariants'
    }),
    color,
    opacity,
    visible,
    typography,
    textShadow,
    spacing,
    layout
  ],
  DefaultText
);
