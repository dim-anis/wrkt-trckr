import { Theme } from '@/lib/theme';
import {
  createVariant,
  createRestyleComponent,
  TypographyProps,
  VariantProps
} from '@shopify/restyle';
import { Link as DefaultLink } from 'expo-router';

const Link = createRestyleComponent<
  VariantProps<Theme, 'buttonVariants'> &
    React.ComponentProps<typeof DefaultLink>,
  Theme
>(
  [
    createVariant<Theme, 'buttonVariants'>({
      themeKey: 'buttonVariants'
    })
  ],
  DefaultLink
);

export default Link;
