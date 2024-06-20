import { Theme } from '@/lib/theme';
import {
  createVariant,
  createRestyleComponent,
  TypographyProps,
  VariantProps,
  layout,
  LayoutProps
} from '@shopify/restyle';
import { Link as DefaultLink } from 'expo-router';

const Link = createRestyleComponent<
  VariantProps<Theme, 'buttonVariants'> &
    LayoutProps<Theme> &
    React.ComponentProps<typeof DefaultLink>,
  Theme
>(
  [
    createVariant<Theme, 'buttonVariants'>({
      themeKey: 'buttonVariants'
    }),
    layout
  ],
  DefaultLink
);

export default Link;
