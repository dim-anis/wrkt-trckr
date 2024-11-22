import { Theme } from '@/lib/theme';
import {
  createVariant,
  createRestyleComponent,
  VariantProps,
  spacing,
  border,
  layout,
  color,
  typography,
  ColorProps,
  LayoutProps,
  SpacingProps,
  BorderProps,
  useTheme,
  TypographyProps
} from '@shopify/restyle';
import { Control, FieldValues, Path, useController } from 'react-hook-form';
import { TextInput as RNTextInput, Pressable } from 'react-native';
import { Box } from './Box';
import { Text } from './Text';
import React, { ReactElement, useRef } from 'react';

type TextInputProps = SpacingProps<Theme> &
  BorderProps<Theme> &
  LayoutProps<Theme> &
  ColorProps<Theme> &
  TypographyProps<Theme> &
  VariantProps<Theme, 'inputVariants', 'inputVariant'> &
  React.ComponentProps<typeof RNTextInput>;

const TextInput = createRestyleComponent<TextInputProps, Theme>(
  [
    layout,
    spacing,
    border,
    color,
    typography,
    createVariant<Theme, 'inputVariants', 'inputVariant'>({
      themeKey: 'inputVariants',
      property: 'inputVariant'
    })
  ],
  RNTextInput
);

interface NInputProps extends TextInputProps {
  label?: string;
  alignLabel?: TextInputProps['textAlign'];
  error?: string;
  disabled?: boolean;
  withInputMessage?: boolean;
  renderLabelInside?: boolean;
  iconLeft?: ReactElement;
  iconRight?: ReactElement;
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
      minHeight,
      borderWidth = 1,
      alignLabel = 'center',
      paddingVertical = 's',
      paddingHorizontal = 'm',
      height = 40,
      disabled = false,
      withInputMessage = true,
      renderLabelInside = false,
      iconLeft,
      iconRight,
      ...inputProps
    } = props;
    const theme = useTheme<Theme>();

    const [isFocused, setIsFocused] = React.useState(false);
    const onBlur = React.useCallback(() => setIsFocused(false), []);
    const onFocus = React.useCallback(() => setIsFocused(true), []);
    const inputBorderColor = isFocused
      ? 'primary'
      : error
        ? 'destructive'
        : 'secondary';

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
      <Box flex={flex} gap="s">
        {label && !renderLabelInside && (
          <Text
            variant="inputLabel"
            color="mutedForeground"
            textAlign={alignLabel}
          >
            {label}
          </Text>
        )}

        <Pressable onPress={handlePress} onBlur={onBlur}>
          <Box
            alignItems="center"
            justifyContent="center"
            borderColor={inputBorderColor}
            borderWidth={borderWidth}
            borderRadius="sm"
            height={height}
            minHeight={minHeight}
            paddingVertical={paddingVertical}
            paddingHorizontal={paddingHorizontal}
          >
            <Box flexDirection="row" alignItems="center" flex={1}>
              {iconLeft && <Box marginRight="s">{iconLeft}</Box>}

              <TextInput
                autoCapitalize="none"
                ref={inputRef}
                onFocus={onFocus}
                onBlur={onBlur}
                editable={!disabled}
                placeholderTextColor={theme.colors.mutedForeground}
                color="primary"
                flex={1}
                {...inputProps}
              />

              {iconRight && inputProps.value && (
                <Box marginLeft="s">{iconRight}</Box>
              )}
            </Box>
          </Box>
        </Pressable>

        {withInputMessage && error && (
          <Text variant="inputLabel" color="destructive">
            {error}
          </Text>
        )}
      </Box>
    );
  }
);
Input.displayName = 'Input';

export function ControlledInput<T extends FieldValues>(
  props: ControlledInputProps<T>
) {
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
      onChangeText={onChange}
      value={value !== undefined && value !== null ? String(value) : ''}
      {...inputProps}
      error={fieldState.error?.message}
    />
  );
}
