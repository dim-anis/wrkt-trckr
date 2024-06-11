import { Box } from '@/components/Box';
import Button from '@/components/Button';
import { ControlledInput } from '@/components/Input';
import { Text } from '@/components/Text';
import { useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  weight: z.coerce.number().min(0.5),
  repetitions: z.coerce.number().min(1),
  rpe: z.coerce.number().min(5).max(10)
});

type FormType = z.infer<typeof schema>;

export default function AddSet() {
  const { categoryId, exerciseId } = useLocalSearchParams();
  const { handleSubmit, control } = useForm<FormType>({
    resolver: zodResolver(schema)
  });

  const onSubmit = data => alert(JSON.stringify(data));

  return (
    <Box padding="m" gap="l" backgroundColor="background" flex={1}>
      <Box gap="m">
        <Text variant="header" color="primary">
          {`Set form for exercise with ID: ${exerciseId}, category with ID: ${categoryId}`}
        </Text>
        <Box>
          <Box marginVertical="s" gap="s">
            <Text variant="inputLabel" color="primary">
              Weight
            </Text>
            <ControlledInput name={'weight'} control={control} />
          </Box>
          <Box marginVertical="s" gap="s">
            <Text variant="inputLabel" color="primary">
              Repetitions
            </Text>
            <ControlledInput name={'repetitions'} control={control} />
          </Box>
          <Box marginVertical="s" gap="s">
            <Text variant="inputLabel" color="primary">
              RPE
            </Text>
            <ControlledInput name={'rpe'} control={control} />
          </Box>
        </Box>
      </Box>
      <Button label="Submit" onPress={handleSubmit(onSubmit)} />
    </Box>
  );
}
