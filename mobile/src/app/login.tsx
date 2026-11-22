/** 登录：手机号 + 验证码。开发环境验证码固定 123456。 */

import { useRouter } from 'expo-router';
import { ArrowRight, Check } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Field } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth, useTheme } from '@/lib/store';
import { tokens } from '@/lib/theme';

const RESEND_SECONDS = 60;

type VerifyResponse = { token: string; expires_at: string; is_new_user: boolean };

export default function LoginScreen() {
  const { palette } = useTheme();
  const { signIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(RESEND_SECONDS);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          if (timer.current) clearInterval(timer.current);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  }, []);

  const phoneValid = /^1\d{10}$/.test(phone);

  const sendCode = async () => {
    if (!phoneValid) {
      setError('请输入 11 位手机号');
      return;
    }
    if (!agreed) {
      setError('请先阅读并同意《用户协议》和《隐私政策》');
      return;
    }
    setError(null);
    setNotice(null);
    setSending(true);
    try {
      await api.post('/api/auth/send-code', { phone });
      startCountdown();
      setNotice('验证码已发送。开发环境固定为 123456');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '发送失败，请重试');
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    if (!phoneValid) {
      setError('请输入 11 位手机号');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('请输入 6 位验证码');
      return;
    }
    setError(null);
    setVerifying(true);
    try {
      const result = await api.post<VerifyResponse>('/api/auth/verify', { phone, code });
      await signIn(result.token, result.is_new_user);
      router.replace(result.is_new_user ? '/onboarding' : '/(tabs)/wardrobe');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '登录失败，请重试');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: palette.background }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: tokens.space.sm }}>
          <Text style={{ fontSize: 40, fontWeight: '800', letterSpacing: -1.4, color: palette.foreground }}>
            iWear
          </Text>
          <AppText tone="muted">把衣柜搬进手机，让 AI 帮你搭配。</AppText>
        </View>

        <View style={{ gap: tokens.space.lg, marginTop: tokens.space['3xl'] }}>
          <Field
            label="手机号"
            value={phone}
            onChangeText={(value) => setPhone(value.replace(/\D/g, '').slice(0, 11))}
            placeholder="13800138000"
            keyboardType="number-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={11}
            error={!phone || phoneValid ? null : '手机号应为 1 开头的 11 位数字'}
          />

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: tokens.space.sm }}>
              <View style={{ flex: 1 }}>
                <Field
                  label="验证码"
                  value={code}
                  onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 位数字"
                  keyboardType="number-pad"
                  autoComplete="sms-otp"
                  textContentType="oneTimeCode"
                  maxLength={6}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={countdown > 0 ? `${countdown} 秒后可重新获取验证码` : '获取验证码'}
                accessibilityState={{ disabled: countdown > 0 || sending }}
                disabled={countdown > 0 || sending}
                onPress={sendCode}
                style={({ pressed }) => [
                  styles.codeButton,
                  {
                    borderColor: palette.border,
                    opacity: countdown > 0 ? 0.5 : pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={{ color: palette.primary, fontWeight: '600', fontSize: tokens.fontSize.sm }}>
                  {countdown > 0 ? `${countdown}s` : sending ? '发送中' : '获取验证码'}
                </Text>
              </Pressable>
            </View>
          </View>

          {error ? (
            <Text accessibilityLiveRegion="polite" style={{ color: palette.destructive, fontSize: tokens.fontSize.sm }}>
              {error}
            </Text>
          ) : notice ? (
            <Text style={{ color: palette.success, fontSize: tokens.fontSize.sm }}>{notice}</Text>
          ) : null}

          <Button
            label="登录"
            onPress={verify}
            loading={verifying}
            disabled={!phoneValid || code.length !== 6 || !agreed}
            icon={<ArrowRight size={18} color={palette.onPrimary} strokeWidth={2} />}
            style={{ marginTop: tokens.space.sm }}
          />
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          accessibilityLabel="我已阅读并同意用户协议和隐私政策"
          onPress={() => setAgreed((value) => !value)}
          style={styles.agreeRow}
          hitSlop={8}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: agreed ? palette.primary : palette.border,
                backgroundColor: agreed ? palette.primary : 'transparent',
              },
            ]}
          >
            {agreed ? <Check size={14} color={palette.onPrimary} strokeWidth={3} /> : null}
          </View>
          <Text style={{ flex: 1, color: palette.mutedForeground, fontSize: tokens.fontSize.sm, lineHeight: 20 }}>
            我已阅读并同意
            <Text onPress={() => router.push('/legal/terms')} style={{ color: palette.primary }}>
              《用户协议》
            </Text>
            和
            <Text onPress={() => router.push('/legal/privacy')} style={{ color: palette.primary }}>
              《隐私政策》
            </Text>
          </Text>
        </Pressable>

        <AppText tone="muted" variant="caption" style={{ marginTop: 'auto', textAlign: 'center' }}>
          登录后，你的衣橱和形象照只对你可见。
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: tokens.space['2xl'],
    gap: tokens.space.xl,
  },
  codeButton: {
    minHeight: tokens.control.lg,
    paddingHorizontal: tokens.space.lg,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.space.md,
    minHeight: tokens.tap,
    paddingVertical: tokens.space.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
});