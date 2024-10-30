import React, { ReactElement, ReactNode } from 'react';
import { Box } from './ui/Box';
import { Text } from './ui/Text';
import { View, ViewProps } from 'react-native';

type TextProps = Omit<React.ComponentProps<typeof Text>, 'children'> &
  ViewProps & {
    children?: string;
  };

type BoxProps = Omit<React.ComponentProps<typeof Box>, 'children'> &
  ViewProps & {
    children?: ReactNode | ReactElement | ReactElement[];
  };

const Card = React.forwardRef<View, BoxProps>(({ ...props }, ref) => (
  <Box
    ref={ref}
    borderRadius="lg"
    backgroundColor="card"
    borderWidth={1}
    borderColor="border"
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<View, BoxProps>(({ ...props }, ref) => (
  <Box ref={ref} flexDirection="column" padding="m" {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<Text, TextProps>(({ ...props }, ref) => (
  <Text
    ref={ref}
    variant="header3"
    color="primary"
    letterSpacing={-0.025}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<Text, TextProps>(
  ({ ...props }, ref) => (
    <Text
      ref={ref}
      variant="body"
      color="mutedForeground"
      lineHeight={20}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<View, BoxProps>(({ ...props }, ref) => (
  <Box ref={ref} padding="m" paddingTop="none" {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<View, BoxProps>(({ ...props }, ref) => (
  <Box ref={ref} alignItems="center" padding="m" paddingTop="none" {...props} />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent
};
