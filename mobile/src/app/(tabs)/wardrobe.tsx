/** 衣橱（M1 阶段：结构 + 空状态，M2 接入数据）。 */

import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText, Button, EmptyState, Screen } from '@/components/ui';
import { useTheme } from '@/lib/store';
import { tokens } from '@/lib/theme';

export default function WardrobeScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const [closet, setCloset] = useState<'owned' | 'tryon'>('owned');

  return (
    <Screen>
      <View style={styles.segmentWrap}>
        <View style={[styles.segment, { backgroundColor: palette.muted }]} accessibilityRole="tablist">
          {(
            [
              { key: 'owned', label: '我的衣橱' },
              { key: 'tryon', label: '试穿衣橱' },
            ] as const
          ).map((option) => {
            const active = closet === option.key;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setCloset(option.key)}
                style={[
                  styles.segmentItem,
                  active && { backgroundColor: palette.card },
                ]}
              >
                <Text
                  style={{
                    fontSize: tokens.fontSize.sm,
                    fontWeight: '600',
                    color: active ? palette.foreground : palette.mutedForeground,
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {closet === 'owned' ? (
        <EmptyState
          title="还没有衣服"
          description="拍下第一件衣服，开始建立你的 iWear 衣橱。背景干净的平铺图试穿效果更好。"
          action={
            <Button
              label="添加衣物"
              icon={<Plus size={18} color={palette.onPrimary} strokeWidth={2.2} />}
              onPress={() => router.push('/(tabs)/tryon')}
            />
          }
        />
      ) : (
        <EmptyState
          title="试穿衣橱是空的"
          description="把网上看到的衣服存进来，买之前先看看上身效果。"
          action={<Button label="添加衣物" variant="secondary" onPress={() => router.push('/(tabs)/tryon')} />}
        />
      )}

      <AppText tone="muted" variant="caption" style={styles.footnote}>
        衣橱功能将在下一步接入。
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentWrap: { paddingHorizontal: tokens.space.xl, paddingTop: tokens.space.lg },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: tokens.radius.lg,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: 36,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footnote: { textAlign: 'center', paddingBottom: tokens.space['2xl'] },
});