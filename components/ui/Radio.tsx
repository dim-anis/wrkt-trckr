import Pressable, { PressableProps } from './Pressable';
import { Text } from './Text';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { TextProps, useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';
import { IconProps as VectorIconsIconProps } from '@expo/vector-icons/build/createIconSet';
import { IoniconsIconName } from '@/types';

export interface RootProps extends Omit<PressableProps, 'onPress'> {
  onChange: (checked: boolean) => void;
  checked?: boolean;
  accessibilityLabel: string;
}

interface ModifiedVectorIconsIconProps<T extends string>
  extends Omit<VectorIconsIconProps<T>, 'name'> {
  name?: T;
}

export interface IconProps
  extends ModifiedVectorIconsIconProps<IoniconsIconName> {
  checked: boolean;
}

interface LabelProps extends TextProps<Theme> {
  text: string;
  testID?: string;
}

const Label = ({ text, testID, ...props }: LabelProps) => {
  return (
    <Text
      testID={testID}
      paddingLeft="s"
      color="primary"
      fontSize={18}
      {...props}
    >
      {text}
    </Text>
  );
};

export const CheckboxIcon = ({ checked = false, ...props }: IconProps) => {
  const theme = useTheme<Theme>();
  return (
    <Ionicons
      name={checked ? 'checkbox-outline' : 'square-outline'}
      color={theme.colors.primary}
      size={20}
      {...props}
    />
  );
};

const CheckboxRoot = ({ checked = false, children, ...props }: RootProps) => {
  return (
    <Root checked={checked} accessibilityRole="checkbox" {...props}>
      {children}
    </Root>
  );
};

const CheckboxBase = ({
  checked = false,
  testID,
  label,

  ...props
}: RootProps & { label?: string; iconName?: IoniconsIconName }) => {
  return (
    <CheckboxRoot checked={checked} testID={testID} {...props}>
      <CheckboxIcon checked={checked} />
      {label ? (
        <Label text={label} testID={testID ? `${testID}-label` : undefined} />
      ) : null}
    </CheckboxRoot>
  );
};

export const Checkbox = Object.assign(CheckboxBase, {
  Icon: CheckboxIcon,
  Root: CheckboxRoot,
  Label
});

export const Root = ({
  checked = false,
  children,
  onChange,
  disabled,
  ...props
}: RootProps) => {
  const handleChange = React.useCallback(() => {
    onChange(!checked);
  }, [onChange, checked]);

  return (
    <Pressable
      onPress={handleChange}
      accessibilityState={{ checked }}
      disabled={disabled}
      {...props}
    >
      {children}
    </Pressable>
  );
};

export const RadioIcon = ({
  checked = false,
  checkedIcon = 'radio-button-on-outline',
  uncheckedIcon = 'radio-button-off-outline',
  ...props
}: IconProps & {
  checkedIcon?: IoniconsIconName;
  uncheckedIcon?: IoniconsIconName;
}) => {
  const theme = useTheme<Theme>();

  return (
    <Ionicons
      name={checked ? checkedIcon : uncheckedIcon}
      color={theme.colors.primary}
      size={24}
      {...props}
    />
  );
};

const RadioRoot = ({ checked = false, children, ...props }: RootProps) => {
  return (
    <Root checked={checked} accessibilityRole="radio" {...props}>
      {children}
    </Root>
  );
};

const RadioBase = ({
  checked = false,
  testID,
  label,
  ...props
}: RootProps & { label?: string }) => {
  return (
    <RadioRoot checked={checked} testID={testID} {...props}>
      <RadioIcon checked={checked} />
      {label ? (
        <Label text={label} testID={testID ? `${testID}-label` : undefined} />
      ) : null}
    </RadioRoot>
  );
};

export const Radio = Object.assign(RadioBase, {
  Icon: RadioIcon,
  Root: RadioRoot,
  Label
});
