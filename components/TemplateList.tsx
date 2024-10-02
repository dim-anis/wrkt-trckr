import { FlashList } from '@shopify/flash-list';
import { Link as ExpoLink } from 'expo-router';
import { Box } from './ui/Box';
import { Text } from './ui/Text';
import { Pressable } from 'react-native';
import TemplateCard from './TemplateCard';
import React from 'react';
import { SetWithExerciseAndCategoryData, TemplateDataItem } from '@/types';

const renderSetsItem = ([
  ,
  [{ templateTitle, templateSubtitle, templateSets, sortedCategories }]
]: [
  string,
  (TemplateDataItem & {
    templateSets: SetWithExerciseAndCategoryData[];
  })[]
]) => {
  return (
    <Box marginTop="s">
      <ExpoLink href="/" asChild>
        <Pressable>
          <TemplateCard
            templateTitle={templateTitle}
            templateSubtitle={templateSubtitle}
            templateSets={templateSets}
            sortedCategories={sortedCategories}
          />
        </Pressable>
      </ExpoLink>
    </Box>
  );
};

export default function WorkoutList({
  templateData = []
}: {
  templateData: [
    string,
    (TemplateDataItem & {
      templateSets: SetWithExerciseAndCategoryData[];
    })[]
  ][];
}) {
  return (
    <>
      {templateData.length ? (
        <FlashList
          data={templateData}
          estimatedItemSize={20}
          renderItem={({ item }) => renderSetsItem(item)}
        />
      ) : (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text color="primary" variant="header3">
            No templates found
          </Text>
        </Box>
      )}
    </>
  );
}
