/** 单品详情（M2 接入）。 */

import { useLocalSearchParams } from 'expo-router';

import { EmptyState, Screen } from '@/components/ui';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <EmptyState title="还没有这件单品的资料" description={`单品 ${id ?? ''} 的详情将在衣橱功能完成后接入。`} />
    </Screen>
  );
}
