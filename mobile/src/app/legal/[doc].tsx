/** 用户协议 / 隐私政策（占位内容，正式文本由项目所有者审定后放进 docs/）。 */

import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText, Card, Screen } from '@/components/ui';
import { tokens } from '@/lib/theme';

const DOCS = {
  terms: {
    title: '用户协议',
    sections: [
      {
        heading: '一、服务内容',
        body: 'iWear 提供衣物管理、AI 试穿预览和搭配建议。AI 生成的内容仅供参考，不构成购买或尺码建议。',
      },
      {
        heading: '二、账号',
        body: '你使用手机号登录。请妥善保管验证码。你可以随时在“我的”里注销账号，注销后数据不可恢复。',
      },
      {
        heading: '三、使用规范',
        body: '不得上传违法内容，不得利用服务干扰他人或攻击系统。',
      },
    ],
  },
  privacy: {
    title: '隐私政策',
    sections: [
      {
        heading: '一、我们收集什么',
        body: '手机号、昵称、可选的性别/城市/身高/体重/腰围/体型/风格标签，以及你上传的衣物照片和形象照。',
      },
      {
        heading: '二、图片如何使用',
        body: '衣物照片和形象照保存在 iWear 服务器，只有你本人登录后可以访问。生成试穿预览和新单品示意图时，图片会发送给第三方 AI 服务。',
      },
      {
        heading: '三、身材数据',
        body: '身高、体重、体型等信息会发送给第三方 AI 服务用于生成搭配建议，不会用于广告或出售。',
      },
      {
        heading: '四、删除',
        body: '你可以单独删除任何图片，也可以在“我的”里注销账号，届时全部数据与文件会被删除。',
      },
    ],
  },
} as const;

type DocKey = keyof typeof DOCS;

export default function LegalScreen() {
  const params = useLocalSearchParams<{ doc?: string }>();
  const navigation = useNavigation();
  const key: DocKey = params.doc === 'privacy' ? 'privacy' : 'terms';
  const doc = DOCS[key];

  useEffect(() => {
    navigation.setOptions({ title: doc.title });
  }, [navigation, doc.title]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: tokens.space.xl, gap: tokens.space.lg, paddingBottom: 48 }}>
        <Card style={{ gap: tokens.space.md }}>
          <AppText variant="title">{doc.title}</AppText>
          <AppText tone="muted" variant="caption">
            版本：V1 草稿，正式文本待补充。
          </AppText>
        </Card>
        {doc.sections.map((section) => (
          <View key={section.heading} style={{ gap: tokens.space.sm }}>
            <AppText variant="heading">{section.heading}</AppText>
            <AppText tone="muted" style={{ lineHeight: 24 }}>
              {section.body}
            </AppText>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
