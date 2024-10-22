import {
  BottomSheetFlatList,
  type BottomSheetModal
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import type { FieldValues } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { Platform, Pressable, type PressableProps } from 'react-native';

import type { InputControllerType } from './Input';
import { Box } from './Box';
import { useModal } from './Modal';
import { Modal } from './Modal';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';
import Badge from '../Badge';
import { FlashList } from '@shopify/flash-list';

export type OptionItem = { label: string; value: string | number };

type OptionsProps = {
  options: OptionItem[];
  onSelect: (option: OptionItem) => void;
  optionsTitle?: string;
  value?: string | number;
};

const List = Platform.OS === 'web' ? FlashList : BottomSheetFlatList;

function keyExtractor(item: OptionItem) {
  return `select-item-${item.value}`;
}

export const Options = React.forwardRef<BottomSheetModal, OptionsProps>(
  ({ options, onSelect, value, optionsTitle }, ref) => {
    const theme = useTheme<Theme>();
    const height = options.length * 70 + 100;
    const snapPoints = React.useMemo(() => [height], [height]);

    const renderSelectItem = React.useCallback(
      ({ item }: { item: OptionItem }) => (
        <Option
          key={`select-item-${item.value}`}
          label={item.label}
          selected={value === item.value}
          onPress={() => onSelect(item)}
        />
      ),
      [onSelect, value]
    );

    return (
      <Modal
        ref={ref}
        index={1}
        title={optionsTitle}
        snapPoints={snapPoints}
        backgroundStyle={{
          backgroundColor: theme.colors.background
        }}
      >
        <Box flex={1} padding="m">
          <List
            data={options}
            keyExtractor={keyExtractor}
            renderItem={renderSelectItem}
            estimatedItemSize={26}
          />
        </Box>
      </Modal>
    );
  }
);

const Option = React.memo(
  ({
    label,
    selected = false,
    ...props
  }: PressableProps & {
    selected?: boolean;
    label: string;
  }) => {
    const theme = useTheme<Theme>();
    return (
      <Pressable {...props}>
        <Box
          borderBottomColor="secondary"
          borderBottomWidth={1}
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          paddingVertical="m"
          paddingHorizontal="s"
        >
          <Text color="primary" fontSize={20} numberOfLines={1} flex={1}>
            {label}
          </Text>

          {selected && (
            <Ionicons
              name="checkmark-outline"
              color={theme.colors.primary}
              size={20}
            />
          )}
        </Box>
      </Pressable>
    );
  }
);

export interface SelectProps {
  onClick?: () => void;
  value?: string | number;
  label?: string;
  disabled?: boolean;
  error?: string;
  options?: OptionItem[];
  onSelect?: (value: string | number) => void;
  placeholder?: string;
  optionsTitle?: string;
}
interface ControlledSelectProps<T extends FieldValues>
  extends SelectProps,
    InputControllerType<T> {}

export const Select = (props: React.PropsWithChildren<SelectProps>) => {
  const {
    label,
    value,
    error,
    options = [],
    placeholder = 'select...',
    disabled = false,
    optionsTitle,
    onSelect,
    onClick,
    children
  } = props;
  const modal = useModal();

  const theme = useTheme<Theme>();
  const onSelectOption = React.useCallback(
    (option: OptionItem) => {
      onSelect?.(option.value);
      modal.dismiss();
    },
    [modal, onSelect]
  );

  const textValue = React.useMemo(
    () =>
      value !== undefined
        ? (options?.filter(t => t.value === value)?.[0]?.label ?? placeholder)
        : placeholder,
    [value, options, placeholder]
  );

  return (
    <>
      <Pressable
        disabled={disabled}
        onPress={() => {
          onClick && onClick();
          modal.present();
        }}
      >
        <Box>
          {children ? (
            children
          ) : (
            <>
              {label && <Text>{label}</Text>}
              <Box
                flexDirection="row"
                alignItems="center"
                bg="secondary"
                borderColor="secondary"
                borderWidth={1}
                borderRadius="sm"
                height={40}
                paddingVertical="s"
                paddingHorizontal="m"
              >
                <Text
                  color="primary"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  flex={1}
                >
                  {textValue}
                </Text>
                <Ionicons
                  name="chevron-down-outline"
                  size={16}
                  color={theme.colors.primary}
                />
              </Box>
            </>
          )}
          {error && <Text color="destructive">{error}</Text>}
        </Box>
      </Pressable>
      <Options
        optionsTitle={optionsTitle}
        ref={modal.ref}
        value={value}
        options={options}
        onSelect={onSelectOption}
      />
    </>
  );
};

// only used with react-hook-form
export function ControlledSelect<T extends FieldValues>(
  props: React.PropsWithChildren<ControlledSelectProps<T>>
) {
  const {
    name,
    control,
    onSelect: onRNSelect,
    onClick,
    children,
    ...selectProps
  } = props;

  const { field, fieldState } = useController({ control, name });
  const onSelect = React.useCallback(
    (value: string | number) => {
      field.onChange(value);
      onRNSelect?.(value);
    },
    [field, onRNSelect]
  );
  return (
    <Select
      onClick={onClick}
      onSelect={onSelect}
      value={field.value}
      error={fieldState.error?.message}
      {...selectProps}
    >
      {children}
    </Select>
  );
}
