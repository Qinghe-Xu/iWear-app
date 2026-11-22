/** 完善资料：昵称必填，其余可跳过。首次登录时进入。 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppText, Button, Field, Screen } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useAuth, useTheme } from '@/lib/store';
import { tokens } from '@/lib/theme';

const GENDERS = [
  { key: 'female', label: '女' },
  { key: 'male', label: '男' },
  { key: 'unspecified', label: '不填' },
] as const;

const STYLE_PRESETS = ['简约', '通勤', '休闲', '复古', '甜美', '中性', '运动', '法式'];

export default function OnboardingScreen() {
  const { palette } = useTheme();
  const { profile, saveProfile, needsOnboarding } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(profile?.name && profile.name !== 'iWear 用户' ? profile.name : '');
  const [gender, setGender] = useState<'female' | 'male' | 'unspecified'>(profile?.gender ?? 'unspecified');
  const [city, setCity] = useState(profile?.city ?? '');
  const [tags, setTags] = useState<string[]>(profile?.style_tags ?? []);
  const [height, setHeight] = useState(profile?.height ? String(profile.height) : '');
  const [weight, setWeight] = useState(profile?.weight ? String(profile.weight) : '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleTag = (tag: string) => {
    setTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : current.length >= 10 ? current : [...current, tag],
    );
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('请填写昵称');
      return;
    }
    if (height && (Number(height) < 80 || Number(height) > 240)) {
      setError('身高应在 80–240 厘米之间');
      return;
    }
    if (weight && (Number(weight) < 25 || Number(weight) > 250)) {
      setError('体重应在 25–250 千克之间');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await saveProfile({
        name: trimmed,
        gender,
        city: city.trim() || null,
        style_tags: tags,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
      } as any);
      router.replace('/(tabs)/wardrobe');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: tokens.space.xl, gap: tokens.space.xl, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {needsOnboarding ? (
            <AppText tone="muted">先简单介绍一下自己，之后可以在“我的”里修改。</AppText>
          ) : null}

          <Field
            label="昵称"
            value={name}
            onChangeText={setName}
            placeholder="怎么称呼你"
            maxLength={20}
          />

          <View style={{ gap: 8 }}>
            <AppText variant="label" weight="semibold">性别</AppText>
            <View style={{ flexDirection: 'row', gap: tokens.space.sm }}>
              {GENDERS.map((option) => {
                const active = gender === option.key;
                return (
                  <Pressable
                    key={option.key}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    onPress={() => setGender(option.key)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? palette.primary : palette.muted,
                        borderColor: active ? palette.primary : palette.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? palette.onPrimary : palette.foreground,
                        fontWeight: '600',
                        fontSize: tokens.fontSize.sm,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Field label="城市（选填）" value={city} onChangeText={setCity} placeholder="例如：上海" maxLength={20} />

          <View style={{ gap: 8 }}>
            <AppText variant="label" weight="semibold">风格标签（选填，最多 10 个）</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm }}>
              {STYLE_PRESETS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: active }}
                    onPress={() => toggleTag(tag)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? palette.primary : palette.muted,
                        borderColor: active ? palette.primary : palette.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? palette.onPrimary : palette.foreground,
                        fontSize: tokens.fontSize.sm,
                        fontWeight: '500',
                      }}
                    >
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <AppText variant="label" weight="semibold">身材（选填）</AppText>
            <AppText tone="muted" variant="caption">
              用于让搭配建议更贴合你。这些信息会发送给第三方 AI 服务生成建议，不会用于其他用途。
            </AppText>
            <View style={{ flexDirection: 'row', gap: tokens.space.md }}>
              <View style={{ flex: 1 }}>
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: tokens.fontSize.sm, fontWeight: '600', color: palette.foreground }}>
                    身高（cm）
                  </Text>
                  <TextInput
                    value={height}
                    onChangeText={(v) => setHeight(v.replace(/\D/g, '').slice(0, 3))}
                    keyboardType="number-pad"
                    placeholder="170"
                    accessibilityLabel="身高，厘米"
                    placeholderTextColor={palette.mutedForeground}
                    style={[
                      styles.input,
                      { backgroundColor: palette.muted, borderColor: palette.border, color: palette.foreground },
                    ]}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: tokens.fontSize.sm, fontWeight: '600', color: palette.foreground }}>
                    体重（kg）
                  </Text>
                  <TextInput
                    value={weight}
                    onChangeText={(v) => setWeight(v.replace(/\D/g, '').slice(0, 3))}
                    keyboardType="number-pad"
                    placeholder="55"
                    accessibilityLabel="体重，千克"
                    placeholderTextColor={palette.mutedForeground}
                    style={[
                      styles.input,
                      { backgroundColor: palette.muted, borderColor: palette.border, color: palette.foreground },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

          {error ? (
            <Text accessibilityLiveRegion="polite" style={{ color: palette.destructive, fontSize: tokens.fontSize.sm }}>
              {error}
            </Text>
          ) : null}

          <Button label="保存" onPress={submit} loading={saving} />
          {needsOnboarding ? (
            <Button
              label="以后再说"
              variant="ghost"
              onPress={() => router.replace('/(tabs)/wardrobe')}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    paddingHorizontal: tokens.space.lg,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: tokens.control.lg,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    paddingHorizontal: tokens.space.lg,
    fontSize: tokens.fontSize.md,
  },
});