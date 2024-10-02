import { Theme } from '@/lib/theme';
import {
  createVariant,
  createRestyleComponent,
  VariantProps,
  backgroundColor,
  spacing,
  border,
  layout,
  color,
  ColorProps,
  LayoutProps,
  SpacingProps,
  BackgroundColorProps,
  BorderProps,
  useTheme
} from '@shopify/restyle';
import { Control, FieldValues, Path, useController } from 'react-hook-form';
import { TextInput as DefaultTextInput } from 'react-native';
import type { TextInput as TTextInput } from 'react-native';
import { Box } from './Box';
import { Text } from './Text';
import React from 'react';

type TextInputProps = SpacingProps<Theme> &
  BorderProps<Theme> &
  LayoutProps<Theme> &
  ColorProps<Theme> &
  BackgroundColorProps<Theme> &
  VariantProps<Theme, 'inputVariants', 'inputVariant'> &
  React.ComponentProps<typeof DefaultTextInput>;

const TextInput = createRestyleComponent<TextInputProps, Theme>(
  [
    layout,
    spacing,
    border,
    backgroundColor,
    color,
    createVariant<Theme, 'inputVariants', 'inputVariant'>({
      themeKey: 'inputVariants',
      property: 'inputVariant'
    })
  ],
  DefaultTextInput
);

interface NInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export type InputControllerType<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  error?: string;
};

interface ControlledInputProps<T extends FieldValues>
  extends NInputProps,
    InputControllerType<T> {}

export const Input = React.forwardRef<TTextInput, NInputProps>((props, ref) => {
  const { error, label, ...inputProps } = props;
  const [isFocused, setIsFocused] = React.useState(false);
  const onBlur = React.useCallback(() => setIsFocused(false), []);
  const onFocus = React.useCallback(() => setIsFocused(true), []);
  const inputVariant = isFocused ? 'focused' : error ? 'error' : undefined;

  return (
    <Box gap="s">
      {label && (
        <Text variant="inputLabel" color="primary">
          {label}
        </Text>
      )}
      <TextInput
        ref={ref}
        inputVariant={inputVariant}
        onBlur={onBlur}
        onFocus={onFocus}
        {...inputProps}
      />
      {error && (
        <Text variant="inputLabel" color="destructive">
          {error}
        </Text>
      )}
    </Box>
  );
});

export function ControlledInput<T extends FieldValues>(
  props: ControlledInputProps<T>
) {
  const theme = useTheme<Theme>();
  const { name, control, ...inputProps } = props;
  const { field, fieldState } = useController({
    control,
    name
  });

  const value =
    typeof field.value === 'string'
      ? field.value
      : typeof field.value === 'number'
        ? `${field.value}`
        : undefined;
  return (
    <Input
      ref={field.ref}
      autoCapitalize="none"
      onChangeText={field.onChange}
      placeholderTextColor={theme.colors.primary}
      value={value}
      {...inputProps}
      error={fieldState.error?.message}
    />
  );
}
