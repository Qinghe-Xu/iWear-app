/** AI 搭配师（M1 阶段：结构占位）。 */

import { EmptyState, Screen } from '@/components/ui';

export default function StylistScreen() {
  return (
    <Screen>
      <EmptyState
        title="问搭配师一个穿搭问题"
        description="例如：明天有面试，我穿什么？建议会基于你衣橱里已有的衣服。"
      />
    </Screen>
  );
}
