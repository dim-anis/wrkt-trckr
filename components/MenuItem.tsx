import { ReactElement } from 'react';
import { Box } from './ui/Box';
import { Text } from './ui/Text';
import { Theme } from '@/lib/theme';
import { TextProps } from '@shopify/restyle';

type Props = {
  label: string;
  iconLeft?: ReactElement;
  iconRight?: ReactElement;
} & TextProps<Theme>;

export default function MenuItem({
  label,
  iconLeft,
  iconRight,
  ...textProps
}: Props) {
  return (
    <Box
      flexDirection="row"
      alignItems="center"
      paddingVertical="s"
      justifyContent="space-between"
    >
      <Box flexDirection="row" alignItems="center">
        {iconLeft && iconLeft}
        <Text fontSize={18} marginLeft="m" color="primary" {...textProps}>
          {label}
        </Text>
      </Box>
      {iconRight && iconRight}
    </Box>
  );
}
