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
import { TextInput as RNTextInput, Pressable } from 'react-native';
import { Box } from './Box';
import { Text } from './Text';
import React, { useEffect, useRef } from 'react';

type TextInputProps = SpacingProps<Theme> &
  BorderProps<Theme> &
  LayoutProps<Theme> &
  ColorProps<Theme> &
  BackgroundColorProps<Theme> &
  VariantProps<Theme, 'inputVariants', 'inputVariant'> &
  React.ComponentProps<typeof RNTextInput>;

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
  RNTextInput
);

interface NInputProps extends TextInputProps {
  label?: string;
  error?: string;
  disabled?: boolean;
  renderInputMessage?: boolean;
  renderLabelInside?: boolean;
}

export type InputControllerType<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  error?: string;
};

interface ControlledInputProps<T extends FieldValues>
  extends NInputProps,
    InputControllerType<T> {}

export const Input = React.forwardRef<RNTextInput, NInputProps>(
  (props, ref) => {
    const {
      flex,
      error,
      label,
      disabled = false,
      renderInputMessage = true,
      renderLabelInside = false,
      value,
      ...inputProps
    } = props;
    const [isFocused, setIsFocused] = React.useState(false);
    const onBlur = React.useCallback(() => setIsFocused(false), []);
    const onFocus = React.useCallback(() => setIsFocused(true), []);
    const inputVariant = isFocused ? 'focused' : error ? 'error' : undefined;
    const inputBorderColor = isFocused
      ? 'primary'
      : error
        ? 'destructive'
        : 'secondary';

    const inputHeight = 50;
    const fontSize = isFocused || value ? 12 : 16;

    const inputRef = useRef<RNTextInput>(null);
    React.useImperativeHandle(ref, () => inputRef.current as RNTextInput);

    // ensure render cycle completes before focusing the input
    const handlePress = () => {
      setIsFocused(true);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    };

    return (
      <Box gap="s" flex={flex}>
        {renderLabelInside ? (
          <Pressable onPress={handlePress} onBlur={onBlur}>
            <Box
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              borderColor={inputBorderColor}
              borderWidth={1}
              borderRadius="sm"
              height={inputHeight}
              paddingVertical="s"
              paddingHorizontal="m"
            >
              {label && (
                <Text
                  variant="inputLabel"
                  color="mutedForeground"
                  fontSize={fontSize}
                >
                  {label}
                </Text>
              )}
              {(isFocused || value) && (
                <TextInput
                  ref={inputRef}
                  value={value}
                  style={{ fontSize: 18, fontWeight: '500' }}
                  textAlign="center"
                  onBlur={onBlur}
                  onFocus={onFocus}
                  color="primary"
                  editable={!disabled}
                  {...inputProps}
                />
              )}
            </Box>
          </Pressable>
        ) : (
          <>
            {label && (
              <Text variant="inputLabel" color="primary">
                {label}
              </Text>
            )}
            <TextInput
              ref={ref}
              value={value}
              inputVariant={inputVariant}
              onBlur={onBlur}
              onFocus={onFocus}
              editable={!disabled}
              {...inputProps}
            />
          </>
        )}
        {error && renderInputMessage && (
          <Text variant="inputLabel" color="destructive">
            {error}
          </Text>
        )}
      </Box>
    );
  }
);

export function ControlledInput<T extends FieldValues>(
  props: ControlledInputProps<T>
) {
  const theme = useTheme<Theme>();
  const { name, control, ...inputProps } = props;
  const {
    field: { ref, onChange, value },
    fieldState
  } = useController({
    control,
    name
  });

  return (
    <Input
      ref={ref}
      autoCapitalize="none"
      onChangeText={onChange}
      placeholderTextColor={theme.colors.mutedForeground}
      value={value !== undefined && value !== null ? String(value) : ''}
      {...inputProps}
      error={fieldState.error?.message}
    />
  );
}
