import { Theme } from '@/lib/theme';
import {
  createRestyleComponent,
  backgroundColor,
  spacing,
  border,
  layout,
  ColorProps,
  LayoutProps,
  SpacingProps,
  BackgroundColorProps,
  BorderProps
} from '@shopify/restyle';
import { Pressable as DefaultPressable } from 'react-native';
import React from 'react';

export type PressableProps = SpacingProps<Theme> &
  BorderProps<Theme> &
  LayoutProps<Theme> &
  ColorProps<Theme> &
  BackgroundColorProps<Theme> &
  React.ComponentProps<typeof DefaultPressable>;

const Pressable = createRestyleComponent<PressableProps, Theme>(
  [layout, spacing, border, backgroundColor],
  DefaultPressable
);

export default Pressable;
