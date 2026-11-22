/** AI 试穿（M1 阶段：结构占位）。 */

import { EmptyState, Screen } from '@/components/ui';

export default function TryOnScreen() {
  return (
    <Screen>
      <EmptyState
        title="还没有试穿记录"
        description="上传一张全身照，再选几件衣服，就能看到上身效果。预计等待 10 秒到 3 分钟。"
      />
    </Screen>
  );
}
