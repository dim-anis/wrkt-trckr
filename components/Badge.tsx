import { PropsWithChildren } from 'react';
import { Box } from './ui/Box';
import { Text } from './ui/Text';

type Props = {
  label: string;
};

export default function Badge({ label, children }: PropsWithChildren<Props>) {
  return (
    <Box
      bg="primary"
      paddingVertical="xxs"
      paddingHorizontal="sm"
      alignItems="center"
      borderRadius="md"
      borderWidth={1}
    >
      <Text
        fontSize={12}
        lineHeight={16}
        fontWeight={700}
        color="primaryForeground"
      >
        {label}
      </Text>
    </Box>
  );
}
