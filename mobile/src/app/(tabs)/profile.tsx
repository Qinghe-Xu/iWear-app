/** 我的：资料摘要、外观、协议、退出与注销。 */

import { useRouter } from 'expo-router';
import {
  ChevronRight,
  FileText,
  LogOut,
  Palette,
  Ruler,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppText, Button, Card, Divider, Field, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth, useTheme } from '@/lib/store';
import { tokens } from '@/lib/theme';

const DELETE_PHRASE = '删除我的账号';

function Row({
  icon,
  title,
  subtitle,
  onPress,
  danger,
  destructive,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  destructive?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.65 : 1 },
      ]}
    >
      {icon}
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontSize: tokens.fontSize.md,
            color: destructive ? palette.destructive : palette.foreground,
            fontWeight: '500',
          }}
        >
          {title}
        </Text>
        {subtitle ? <AppText variant="caption" tone="muted">{subtitle}</AppText> : null}
      </View>
      {danger ? <Trash2 size={18} color={palette.destructive} /> : <ChevronRight size={18} color={palette.mutedForeground} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { palette } = useTheme();
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const doDelete = async () => {
    setDeleteError(null);
    if (phrase.trim() !== DELETE_PHRASE) {
      setDeleteError(`请输入“${DELETE_PHRASE}”`);
      return;
    }
    setDeleting(true);
    try {
      await api.delete('/api/user', { confirm: phrase.trim() });
      await signOut();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : '注销失败，请重试');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: tokens.space.xl, gap: tokens.space.lg, paddingBottom: 48 }}>
        <Card style={{ gap: tokens.space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space.md }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: palette.muted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserRound size={26} color={palette.foreground} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="heading">{profile?.name ?? 'iWear 用户'}</AppText>
              <AppText tone="muted" variant="caption">
                {profile?.phone ? `${profile.phone.slice(0, 3)}****${profile.phone.slice(-4)}` : ''}
              </AppText>
            </View>
          </View>
          <Divider />
          <AppText tone="muted" variant="label">
            {[
              profile?.gender === 'male' ? '男' : profile?.gender === 'female' ? '女' : '未填性别',
              profile?.height ? `${profile.height}cm` : null,
              profile?.weight ? `${profile.weight}kg` : null,
              profile?.body_shape ? '已填体型' : null,
              profile?.city,
            ]
              .filter(Boolean)
              .join(' · ')}
          </AppText>
        </Card>

        <Card style={{ paddingVertical: 0, paddingHorizontal: tokens.space.lg }}>
          <Row
            icon={<UserRound size={20} color={palette.foreground} strokeWidth={1.8} />}
            title="资料"
            subtitle="昵称、性别、城市、风格标签"
            onPress={() => router.push('/onboarding')}
          />
          <Divider />
          <Row
            icon={<Ruler size={20} color={palette.foreground} strokeWidth={1.8} />}
            title="身材信息"
            subtitle="让搭配建议更贴合你"
            onPress={() => router.push('/onboarding')}
          />
          <Divider />
          <Row
            icon={<Palette size={20} color={palette.foreground} strokeWidth={1.8} />}
            title="外观"
            subtitle={`当前：${palette.label}`}
            onPress={() => router.push('/appearance')}
          />
        </Card>

        <Card style={{ paddingVertical: 0, paddingHorizontal: tokens.space.lg }}>
          <Row
            icon={<FileText size={20} color={palette.foreground} strokeWidth={1.8} />}
            title="用户协议"
            onPress={() => router.push('/legal/terms')}
          />
          <Divider />
          <Row
            icon={<ShieldCheck size={20} color={palette.foreground} strokeWidth={1.8} />}
            title="隐私政策"
            onPress={() => router.push('/legal/privacy')}
          />
        </Card>

        <Card style={{ paddingVertical: 0, paddingHorizontal: tokens.space.lg }}>
          <Row
            icon={<LogOut size={20} color={palette.foreground} strokeWidth={1.8} />}
            title="退出登录"
            onPress={() =>
              Alert.alert('退出登录', '确定要退出吗？', [
                { text: '取消', style: 'cancel' },
                { text: '退出', style: 'destructive', onPress: () => void signOut() },
              ])
            }
          />
          <Divider />
          <Row
            icon={<Trash2 size={20} color={palette.destructive} strokeWidth={1.8} />}
            title="注销账号"
            subtitle="删除全部衣橱、形象照和对话，不可恢复"
            danger
            destructive
            onPress={() => setDeleteOpen((value) => !value)}
          />
        </Card>

        {deleteOpen ? (
          <Card style={{ gap: tokens.space.md, borderColor: palette.destructive }}>
            <AppText variant="heading" tone="destructive">
              注销账号
            </AppText>
            <AppText tone="muted" variant="label">
              此操作会永久删除你的衣橱、形象照、试穿记录和对话，无法恢复。
            </AppText>
            <Field
              label={`输入“${DELETE_PHRASE}”确认`}
              value={phrase}
              onChangeText={setPhrase}
              placeholder={DELETE_PHRASE}
              autoCapitalize="none"
              error={deleteError}
            />
            <Button
              label="永久删除我的账号"
              variant="destructive"
              onPress={doDelete}
              loading={deleting}
              disabled={phrase.trim() !== DELETE_PHRASE}
            />
          </Card>
        ) : null}

        <AppText tone="muted" variant="caption" style={{ textAlign: 'center' }}>
          iWear v1.0.0
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    minHeight: 56,
    paddingVertical: tokens.space.md,
  },
});