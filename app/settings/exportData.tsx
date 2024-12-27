import MenuItem from '@/components/MenuItem';
import { Box } from '@/components/ui/Box';
import { Stack } from 'expo-router';
import { Platform, Pressable } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

const DB_NAME = 'user.db';
const SQLITE_MIME_TYPE = 'application/vnd.sqlite3';

export default function ExportData() {
  const dbUri = `${FileSystem.documentDirectory}/SQLite/${DB_NAME}`;

  const exportDb = async (uri: string, filename: string, mimeType: string) => {
    if (Platform.OS === 'android') {
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64
        });

        await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          filename,
          mimeType
        )
          .then(
            async uri =>
              await FileSystem.writeAsStringAsync(uri, base64, {
                encoding: FileSystem.EncodingType.Base64
              })
          )
          .catch(e => console.log(e));
      } else {
        shareAsync(uri);
      }
    } else {
      shareAsync(uri);
    }
  };

  return (
    <Box padding="m" backgroundColor="background" flex={1} gap="l">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Export data'
        }}
      />
      <Box>
        <Pressable onPress={() => exportDb(dbUri, DB_NAME, SQLITE_MIME_TYPE)}>
          <MenuItem label="Export as .sqlite3" icon="download-outline" />
        </Pressable>
        <Pressable>
          <MenuItem label="Export as .csv" icon="download-outline" />
        </Pressable>
      </Box>
    </Box>
  );
}
