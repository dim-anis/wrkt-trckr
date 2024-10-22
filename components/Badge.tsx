import { ReactElement } from 'react';
import { Box } from './ui/Box';
import { Text } from './ui/Text';
import { BoxProps, TextProps } from '@shopify/restyle';
import { Theme } from '@/lib/theme';

type Props = {
  label: string;
  icon?: ReactElement;
} & BoxProps<Theme> &
  TextProps<Theme>;

export default function Badge(props: Props) {
  const {
    label,
    icon,
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
      <Text
        fontSize={fontSize}
        lineHeight={lineHeight}
        fontWeight={fontWeight}
        color={color}
      >
        {label}
      </Text>
      {icon && icon}
    </Box>
  );
}
