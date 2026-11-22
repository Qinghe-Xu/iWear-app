/** 外观：两套主题切换，带实时预览。 */

import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { useTheme } from '@/lib/store';
import { palettes, themeNames, tokens, type Palette } from '@/lib/theme';

function PreviewCard({
  palette,
  selected,
  onPress,
}: {
  palette: Palette;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette: current } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${palette.label}主题`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: selected ? current.primary : current.border,
          borderWidth: selected ? 2 : 1,
          backgroundColor: palette.background,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={[styles.previewSurface, { backgroundColor: palette.imageSurface }]}>
        <View style={[styles.mockPill, { backgroundColor: palette.muted }]} />
        <View style={{ gap: 8, padding: 12 }}>
          <View style={[styles.mockLine, { backgroundColor: palette.foreground, width: '62%' }]} />
          <View style={[styles.mockLine, { backgroundColor: palette.mutedForeground, width: '84%', height: 6 }]} />
          <View style={[styles.mockButton, { backgroundColor: palette.primary }]} />
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={{ fontWeight: '700', fontSize: tokens.fontSize.lg, color: palette.foreground }}>
          {palette.label}
        </Text>
        {selected ? (
          <View style={[styles.check, { backgroundColor: current.primary }]}>
            <Check size={12} color={current.onPrimary} strokeWidth={3} />
          </View>
        ) : null}
      </View>
      <Text style={{ fontSize: tokens.fontSize.xs, color: palette.mutedForeground, paddingHorizontal: 12 }}>
        {palette.name === 'plain' ? '看衣服颜色最准' : '时尚感更强'}
      </Text>
    </Pressable>
  );
}

export default function AppearanceScreen() {
  const { themeName, setTheme } = useTheme();
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: tokens.space.xl, gap: tokens.space.lg }}>
        <AppText tone="muted">
          选择界面主题。两套主题只看界面颜色，不影响你上传的照片。
        </AppText>
        <View style={styles.grid} accessibilityRole="radiogroup">
          {themeNames.map((name) => (
            <PreviewCard
              key={name}
              palette={palettes[name]}
              selected={themeName === name}
              onPress={() => setTheme(name)}
            />
          ))}
        </View>
        <View style={{ gap: tokens.space.sm, marginTop: tokens.space.lg }}>
          <AppText variant="label" weight="semibold">
            说明
          </AppText>
          <AppText tone="muted" variant="caption">
            衣橱卡片和试穿结果里的图片区域始终使用中性浅灰底，所以两套主题下看到的衣物颜色一致。
          </AppText>
          <AppText tone="muted" variant="caption">
            当前主题只保存在这台设备上。
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: tokens.space.lg },
  card: {
    flex: 1,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    paddingBottom: tokens.space.md,
    gap: 6,
    minHeight: 220,
  },
  previewSurface: { height: 150 },
  mockPill: { height: 10, width: 56, borderRadius: 5, margin: 12 },
  mockLine: { height: 8, borderRadius: 4 },
  mockButton: { height: 26, borderRadius: 8, marginTop: 6 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  check: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});