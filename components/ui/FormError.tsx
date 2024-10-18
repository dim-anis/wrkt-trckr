import { ReactElement } from 'react';
import { Box } from './Box';
import { Text } from './Text';

type FormErrorProps = {
  errorText: string;
  fieldName: string;
  icon?: ReactElement;
};

export default function FormError({
  errorText,
  fieldName,
  icon
}: FormErrorProps) {
  return (
    <Box
      gap="s"
      paddingHorizontal="sm"
      flexDirection="row"
      alignItems="center"
      bg={'destructive'}
      borderRadius="sm"
      paddingVertical="xs"
    >
      <Box>{icon && icon}</Box>
      <Box gap="xxs">
        <Text
          lineHeight={20}
          variant="inputLabel"
          fontSize={14}
          fontWeight={700}
          color="destructiveForeground"
        >
          {fieldName}
        </Text>
        <Text
          lineHeight={20}
          variant="inputLabel"
          fontSize={14}
          color="destructiveForeground"
        >
          {errorText}
        </Text>
      </Box>
    </Box>
  );
}
