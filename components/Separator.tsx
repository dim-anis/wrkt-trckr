import { BoxProps } from '@shopify/restyle';
import { Box } from './ui/Box';
import { Theme } from '@/lib/theme';

type Props = {
  orientation?: 'horizontal' | 'vertical';
} & BoxProps<Theme>;

export default function Separator({
  orientation = 'horizontal',
  ...props
}: Props) {
  return (
    <Box
      width={orientation === 'horizontal' ? 'auto' : 1}
      height={orientation === 'horizontal' ? 1 : 'auto'}
      backgroundColor="muted"
      borderRadius="sm"
      marginVertical="s"
      marginHorizontal="s"
      {...props}
    />
  );
}
