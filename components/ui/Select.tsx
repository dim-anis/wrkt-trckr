import {
  BottomSheetFlatList,
  type BottomSheetModal
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import type { FieldValues } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { Pressable, type PressableProps } from 'react-native';

import type { InputControllerType } from './Input';
import { Box } from './Box';
import { useModal } from './Modal';
import { Modal } from './Modal';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';
import { FlashList } from '@shopify/flash-list';

export type OptionItem = { label: string; value: string | number };

type OptionsProps = {
  options: OptionItem[];
  onSelect: (option: OptionItem) => void;
  value?: string | number;
};

const List = Platform.OS === 'web' ? FlashList : BottomSheetFlatList;

function keyExtractor(item: OptionItem) {
  return `select-item-${item.value}`;
}

export const Options = React.forwardRef<BottomSheetModal, OptionsProps>(
  ({ options, onSelect, value }, ref) => {
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
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{
          backgroundColor: theme.colors.background
        }}
      >
        <Box flex={1} padding="m">
          <BottomSheetFlatList
            data={options}
            keyExtractor={keyExtractor}
            renderItem={renderSelectItem}
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
          borderColor="secondary"
          paddingVertical="s"
          borderBottomWidth={1}
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Text fontSize={20} color="primary">
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
}
interface ControlledSelectProps<T extends FieldValues>
  extends SelectProps,
    InputControllerType<T> {}

export const Select = (props: SelectProps) => {
  const {
    label,
    value,
    error,
    options = [],
    placeholder = 'select...',
    disabled = false,
    onSelect,
    onClick
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
      <Box>
        {label && <Text>{label}</Text>}
        <Pressable
          disabled={disabled}
          onPress={() => {
            onClick && onClick();
            modal.present();
          }}
        >
          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            bg="secondary"
            borderColor="secondary"
            borderWidth={1}
            borderRadius="sm"
            height={40}
            paddingVertical="s"
            paddingHorizontal="m"
          >
            <Text color="primary" numberOfLines={1} flex={1}>
              {textValue}
            </Text>
            <Ionicons
              name="caret-down"
              size={15}
              color={theme.colors.primary}
            />
          </Box>
        </Pressable>
        {error && <Text color="destructive">{error}</Text>}
      </Box>
      <Options
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
  props: ControlledSelectProps<T>
) {
  const { name, control, onSelect: onNSelect, onClick, ...selectProps } = props;

  const { field, fieldState } = useController({ control, name });
  const onSelect = React.useCallback(
    (value: string | number) => {
      field.onChange(value);
      onNSelect?.(value);
    },
    [field, onNSelect]
  );
  return (
    <Select
      onClick={onClick}
      onSelect={onSelect}
      value={field.value}
      error={fieldState.error?.message}
      {...selectProps}
    />
  );
}
