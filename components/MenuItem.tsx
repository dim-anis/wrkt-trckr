import { ReactElement } from 'react';
import { Box } from './ui/Box';
import { Text } from './ui/Text';
import { Theme } from '@/lib/theme';

type Props = {
  label: string;
  textColor: keyof Theme['colors'];
  iconLeft?: ReactElement;
  iconRight?: ReactElement;
};

export default function MenuItem({
  label,
  textColor = 'primary',
  iconLeft,
  iconRight
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
        <Text color={textColor} fontSize={18} marginLeft="m">
          {label}
        </Text>
      </Box>
      {iconRight && iconRight}
    </Box>
  );
}
