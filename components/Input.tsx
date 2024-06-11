import { Theme } from '@/lib/theme';
import {
  createVariant,
  createRestyleComponent,
  TypographyProps,
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
  BorderProps
} from '@shopify/restyle';
import { Control, FieldValues, Path, useController } from 'react-hook-form';
import { TextInput as DefaultTextInput, TextInputProps } from 'react-native';
import type { TextInput as TTextInput } from 'react-native';
import { Box } from './Box';
import { Text } from './Text';
import React from 'react';

const TextInput = createRestyleComponent<
  SpacingProps<Theme> &
    BorderProps<Theme> &
    LayoutProps<Theme> &
    ColorProps<Theme> &
    BackgroundColorProps<Theme> &
    VariantProps<Theme, 'inputVariants', 'inputVariant'> &
    React.ComponentProps<typeof DefaultTextInput>,
  Theme
>(
  [
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
  error?: string;
}

type InputControllerType<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  error?: string;
};

interface ControlledInputProps<T extends FieldValues>
  extends NInputProps,
    InputControllerType<T> {}

export const Input = React.forwardRef<TTextInput, NInputProps>((props, ref) => {
  const { error, ...inputProps } = props;
  const [isFocused, setIsFocused] = React.useState(false);
  const onBlur = React.useCallback(() => setIsFocused(false), []);
  const onFocus = React.useCallback(() => setIsFocused(true), []);
  const inputVariant = isFocused ? 'focused' : error ? 'error' : undefined;

  return (
    <Box>
      <TextInput
        inputVariant={inputVariant}
        autoCapitalize="none"
        keyboardType="numeric"
        inputMode="numeric"
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
  const { name, control, ...inputProps } = props;
  const { field, fieldState } = useController({
    control,
    name
  });
  return (
    <Input
      ref={field.ref}
      autoCapitalize="none"
      onChangeText={field.onChange}
      value={(field.value as string) || ''}
      {...inputProps}
      error={fieldState.error?.message}
    />
  );
}
