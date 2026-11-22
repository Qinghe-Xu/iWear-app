/** 基础界面组件。颜色全部来自 useTheme()。 */

import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/lib/store';
import { tokens } from '@/lib/theme';

/* ---------- 文字 ---------- */

type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';
type TextTone = 'default' | 'muted' | 'primary' | 'inverse' | 'destructive' | 'onPrimary';

const fontSizes: Record<TextVariant, number> = {
  display: tokens.fontSize['3xl'],
  title: tokens.fontSize['2xl'],
  heading: tokens.fontSize.lg,
  body: tokens.fontSize.md,
  label: tokens.fontSize.sm,
  caption: tokens.fontSize.xs,
};

const lineHeights: Record<TextVariant, number> = {
  display: tokens.lineHeight['3xl'],
  title: tokens.lineHeight['2xl'],
  heading: tokens.lineHeight.lg,
  body: tokens.lineHeight.md,
  label: tokens.lineHeight.sm,
  caption: tokens.lineHeight.xs,
};

export function AppText({
  children,
  variant = 'body',
  tone = 'default',
  style,
  numberOfLines,
  weight,
}: {
  children: ReactNode;
  variant?: TextVariant;
  tone?: TextTone;
  style?: StyleProp<any>;
  numberOfLines?: number;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}) {
  const { palette } = useTheme();
  const color =
    tone === 'muted'
      ? palette.mutedForeground
      : tone === 'primary'
        ? palette.primary
        : tone === 'inverse'
          ? palette.onPrimary
          : tone === 'destructive'
            ? palette.destructive
            : tone === 'onPrimary'
              ? palette.onPrimary
              : palette.foreground;
  const isHeading = variant === 'display' || variant === 'title' || variant === 'heading';
  const resolvedWeight = weight ?? (isHeading ? 'bold' : 'regular');
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          color,
          fontSize: fontSizes[variant],
          lineHeight: lineHeights[variant],
          fontWeight:
            resolvedWeight === 'bold'
              ? '700'
              : resolvedWeight === 'semibold'
                ? '600'
                : resolvedWeight === 'medium'
                  ? '500'
                  : '400',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/* ---------- 按钮 ---------- */

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}) {
  const { palette } = useTheme();
  const inactive = disabled || loading;
  const background =
    variant === 'primary'
      ? palette.primary
      : variant === 'destructive'
        ? palette.destructive
        : 'transparent';
  const foreground =
    variant === 'primary'
      ? palette.onPrimary
      : variant === 'destructive'
        ? palette.onDestructive
        : variant === 'ghost'
          ? palette.primary
          : palette.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: background,
          borderColor: variant === 'secondary' ? palette.border : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
          opacity: inactive ? 0.45 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon}
          <Text style={{ color: foreground, fontSize: tokens.fontSize.md, fontWeight: '600' }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/* ---------- 输入框 ---------- */

export function Field({
  label,
  hint,
  error,
  ...props
}: TextInputProps & { label: string; hint?: string; error?: string | null }) {
  const { palette } = useTheme();
  return (
    <View style={{ gap: 6, alignSelf: 'stretch' }}>
      <Text style={{ color: palette.foreground, fontSize: tokens.fontSize.sm, fontWeight: '600' }}>
        {label}
      </Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={palette.mutedForeground}
        style={[
          styles.input,
          {
            backgroundColor: palette.muted,
            borderColor: error ? palette.destructive : palette.border,
            color: palette.foreground,
          },
          props.style,
        ]}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={{ color: palette.destructive, fontSize: tokens.fontSize.xs }}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={{ color: palette.mutedForeground, fontSize: tokens.fontSize.xs }}>{hint}</Text>
      ) : null}
    </View>
  );
}

/* ---------- 布局辅助 ---------- */

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { palette } = useTheme();
  return <View style={[{ flex: 1, backgroundColor: palette.background }, style]}>{children}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: palette.card,
          borderRadius: tokens.radius.lg,
          borderWidth: 1,
          borderColor: palette.border,
          padding: tokens.space.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Divider() {
  const { palette } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: palette.border }} />;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyMark, { backgroundColor: palette.muted }]} />
      <AppText variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      <AppText tone="muted" style={{ textAlign: 'center', maxWidth: 280 }}>
        {description}
      </AppText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: tokens.control.lg,
    minWidth: tokens.tap,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.sm,
  },
  input: {
    alignSelf: 'stretch',
    minHeight: tokens.control.lg,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    paddingHorizontal: tokens.space.lg,
    fontSize: tokens.fontSize.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.md,
    padding: tokens.space['3xl'],
  },
  emptyMark: { width: 72, height: 72, borderRadius: 36, marginBottom: tokens.space.sm },
});
