/** 根路径：按登录状态跳转。 */

import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth, useTheme } from '@/lib/store';

export default function Index() {
  const { status } = useAuth();
  const { palette } = useTheme();

  if (status === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.background,
        }}
      >
        <ActivityIndicator color={palette.primary} size="large" />
      </View>
    );
  }

  return <Redirect href={status === 'signedIn' ? '/(tabs)/wardrobe' : '/login'} />;
}