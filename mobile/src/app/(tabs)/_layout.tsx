/** 底部四个标签：衣橱、试穿、搭配师、我的。 */

import { Tabs } from 'expo-router';
import { MessageCircle, Shirt, Sparkles, User } from 'lucide-react-native';

import { useTheme } from '@/lib/store';
import { tokens } from '@/lib/theme';

export default function TabsLayout() {
  const { palette } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', fontSize: tokens.fontSize.lg },
        headerTintColor: palette.foreground,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.mutedForeground,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.border,
          height: 60,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: palette.background },
      }}
    >
      <Tabs.Screen
        name="wardrobe"
        options={{
          tabBarButtonTestID: "tab-wardrobe",
          title: '衣橱',
          headerTitle: 'iWear',
          tabBarIcon: ({ color, focused }) => (
            <Shirt size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="tryon"
        options={{
          tabBarButtonTestID: "tab-tryon",
          title: '试穿',
          tabBarIcon: ({ color, focused }) => (
            <Sparkles size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="stylist"
        options={{
          tabBarButtonTestID: "tab-stylist",
          title: '搭配师',
          tabBarIcon: ({ color, focused }) => (
            <MessageCircle size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarButtonTestID: "tab-profile",
          title: '我的',
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
    </Tabs>
  );
}