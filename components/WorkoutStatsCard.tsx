import { format, formatDuration, intervalToDuration } from 'date-fns';
import { Box } from './ui/Box';
import { Text } from './ui/Text';
import Separator from './Separator';
import { convertToLbs, formatNumber, roundToNearestHalf } from '@/lib/utils';
import ExerciseList from './ExerciseList';
import { Workout } from '@/app/stats/(tabs)/types';

export default function WorkoutStatsCard({
  workoutName,
  workoutStart,
  workoutStats,
  exercises,
  isMetric = true
}: Omit<Workout, 'categories' | 'workoutId'> & { isMetric: boolean }) {
  const totalVolumeFormatted =
    workoutStats &&
    formatNumber(
      Number(
        isMetric
          ? workoutStats.volume
          : convertToLbs(workoutStats.volume).toFixed(1)
      )
    );
  return (
    <Box>
      <Box
        gap="xs"
        bg="secondary"
        padding="m"
        borderTopLeftRadius="md"
        borderTopRightRadius="md"
      >
        <Box gap="xs">
          <Text color="primary" fontSize={18} fontWeight={500}>
            {workoutName}
          </Text>
          <Text color="mutedForeground" fontSize={12}>
            {format(workoutStart, 'EEE, MMM dd, yyyy')}
          </Text>
        </Box>

        {workoutStats && (
          <Box>
            <Separator
              orientation="horizontal"
              marginHorizontal="none"
              backgroundColor="mutedForeground"
            />
            <Box flexDirection="row" gap="s">
              <Box flexDirection="column" gap="xs">
                <Text color="mutedForeground" fontSize={14}>
                  Volume
                </Text>
                <Text color="primary" fontSize={20}>
                  {`${totalVolumeFormatted} ${isMetric ? 'kg' : 'lb'}`}
                </Text>
              </Box>
              <Separator
                orientation="vertical"
                backgroundColor="mutedForeground"
              />
              {workoutStats.avgRpe !== null && workoutStats.avgRpe > 0 && (
                <>
                  <Box flexDirection="column" gap="xs">
                    <Text color="mutedForeground" fontSize={14}>
                      RPE
                    </Text>
                    <Text color="primary" fontSize={20}>
                      {roundToNearestHalf(workoutStats.avgRpe)}
                    </Text>
                  </Box>
                  <Separator
                    orientation="vertical"
                    backgroundColor="mutedForeground"
                  />
                </>
              )}
              <Box flexDirection="column" gap="xs">
                <Text color="mutedForeground" fontSize={14}>
                  Sets
                </Text>
                <Text color="primary" fontSize={20}>
                  {workoutStats.setCount}
                </Text>
              </Box>
              {workoutStats.totalTime > 0 && (
                <>
                  <Separator
                    orientation="vertical"
                    backgroundColor="mutedForeground"
                  />
                  <Box flexDirection="column" gap="xs">
                    <Text color="mutedForeground" fontSize={14}>
                      Time
                    </Text>
                    <Text color="primary" fontSize={20}>
                      {formatDuration(
                        intervalToDuration({
                          start: 0,
                          end: workoutStats.totalTime
                        })
                      )}
                    </Text>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        )}
      </Box>
      <Box
        flexDirection="column"
        padding="m"
        borderWidth={1}
        borderColor="secondary"
        borderTopWidth={0}
        borderBottomLeftRadius="md"
        borderBottomRightRadius="md"
      >
        <Box flexDirection="row" gap="s">
          <Box flex={1}>
            <Text variant="body" color="mutedForeground" fontWeight={500}>
              Exercise
            </Text>
          </Box>
          <Box flex={1}>
            <Text variant="body" color="mutedForeground" fontWeight={500}>
              Sets
            </Text>
          </Box>
        </Box>
        <Separator marginHorizontal="none" />
        <ExerciseList exercises={exercises} />
      </Box>
    </Box>
  );
}
