import { ReactElement } from 'react';
import { Box } from './ui/Box';
import { Text } from './ui/Text';

type Props = {
  label: string;
  icon?: ReactElement;
};

export default function Badge({ label, icon }: Props) {
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
    >
      <Text
        fontSize={12}
        lineHeight={16}
        fontWeight={700}
        color="primaryForeground"
      >
        {label}
      </Text>
      {icon && icon}
    </Box>
  );
}
