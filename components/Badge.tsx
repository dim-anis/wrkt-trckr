import { ReactElement } from 'react';
import { Box } from './ui/Box';
import { Text } from './ui/Text';
import { BoxProps, TextProps } from '@shopify/restyle';
import { Theme } from '@/lib/theme';

type Props = {
  label: string;
  iconLeft?: ReactElement;
  iconRight?: ReactElement;
} & BoxProps<Theme> &
  TextProps<Theme>;

export default function Badge(props: Props) {
  const {
    label,
    iconLeft,
    iconRight,
    fontSize = 12,
    lineHeight = 16,
    fontWeight = 700,
    color = 'primaryForeground',
    ...viewProps
  } = props;
  return (
    <Box
      bg="primary"
      paddingVertical="xxs"
      paddingHorizontal="sm"
      alignItems="center"
      justifyContent="center"
      borderRadius="md"
      borderWidth={1}
      flexDirection="row"
      gap="xxs"
      {...viewProps}
    >
      {iconLeft && <Box marginRight="xs">{iconLeft}</Box>}
      <Text
        fontSize={fontSize}
        lineHeight={lineHeight}
        fontWeight={fontWeight}
        color={color}
      >
        {label}
      </Text>
      {iconRight && <Box marginLeft="xs">{iconRight}</Box>}
    </Box>
  );
}
