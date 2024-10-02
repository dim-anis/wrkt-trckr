import { Ionicons } from '@expo/vector-icons';
import { Box } from './ui/Box';
import { Text } from './ui/Text';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';
import { IoniconsIconName } from '@/types';

export default function MenuItem({
  label,
  icon,
  iconRight
}: {
  label: string;
  icon?: IoniconsIconName;
  iconRight?: IoniconsIconName;
}) {
  const theme = useTheme<Theme>();

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      paddingVertical="s"
      justifyContent="space-between"
    >
      <Box flexDirection="row" alignItems="center">
        <Ionicons name={icon} color={theme.colors.primary} size={20} />
        <Text color="primary" fontSize={18} marginLeft="m">
          {label}
        </Text>
      </Box>
      {iconRight && (
        <Ionicons name={iconRight} color={theme.colors.primary} size={20} />
      )}
    </Box>
  );
}
