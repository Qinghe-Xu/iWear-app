/** 带鉴权头加载后端图片（/api/files/...）。两套主题下图片区都用中性底色。 */

import { Image, type ImageContentFit } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { fileUrl } from '@/lib/api';
import { getItem, STORAGE_KEYS } from '@/lib/storage';
import { useTheme } from '@/lib/store';
import { tokens } from '@/lib/theme';

type Props = {
  /** 后端返回的相对路径，如 /api/files/abc.png；也接受完整 URL */
  path: string | null | undefined;
  style?: StyleProp<ViewStyle>;
  contentFit?: ImageContentFit;
  /** 无障碍描述；纯装饰时不传 */
  alt?: string;
  borderRadius?: number;
  /** 图片区底色（默认中性浅灰，不适合照片时传 'transparent'） */
  surface?: 'imageSurface' | 'transparent';
};

export function AuthImage({
  path,
  style,
  contentFit = 'cover',
  alt,
  borderRadius = tokens.radius.md,
  surface = 'imageSurface',
}: Props) {
  const { palette } = useTheme();
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    getItem(STORAGE_KEYS.token).then((value) => {
      if (alive) setToken(value);
    });
    return () => {
      alive = false;
    };
  }, [path]);

  useEffect(() => {
    setFailed(false);
  }, [path]);

  const backgroundColor = surface === 'transparent' ? 'transparent' : palette.imageSurface;

  if (!path) {
    return <View style={[styles.base, { backgroundColor, borderRadius }, style]} />;
  }

  if (token === undefined) {
    return (
      <View style={[styles.base, { backgroundColor, borderRadius }, style]}>
        <ActivityIndicator color={palette.mutedForeground} />
      </View>
    );
  }

  return (
    <View style={[styles.base, { backgroundColor, borderRadius }, style]}>
      <Image
        source={{ uri: fileUrl(path), headers: token ? { Authorization: `Bearer ${token}` } : undefined }}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        transition={180}
        recyclingKey={path}
        accessibilityLabel={alt}
        accessible={Boolean(alt)}
        onError={() => setFailed(true)}
        cachePolicy="memory-disk"
      />
      {failed ? (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <ActivityIndicator color={palette.mutedForeground} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
