import { Box } from './ui/Box';
import { Text } from './ui/Text';

type Props = {
  title: string;
  value: number;
  unit?: string;
};
export default function StatsCard({ title, value, unit }: Props) {
  return (
    <Box
      borderRadius="md"
      backgroundColor="card"
      borderWidth={1}
      borderColor="border"
      flexGrow={1}
    >
      <Box padding="m">
        <Text variant="body" color="mutedForeground">
          {title}
        </Text>
        <Text variant="header3" color="primary">
          {`${value} ${unit ? unit : ''}`}
        </Text>
      </Box>
    </Box>
  );
}
