import { Pill } from '@/components/primitives/Pill';
import { fillTemplate } from '@/lib/format';
import { stockBadgeState } from '@/lib/products/stock';
import type { StockState } from '@/lib/products/types';

export type StockBadgeLabels = { out: string; low: string; ok: string };

type Props = {
  stock: number | null;
  lowThreshold: number;
  labels: StockBadgeLabels;
  className?: string;
};

const tones: Record<StockState, 'status-out' | 'status-low' | 'status-ok'> = {
  out: 'status-out',
  low: 'status-low',
  ok: 'status-ok',
};

/** Renders nothing when stock is unknown. */
export function StockBadge({ stock, lowThreshold, labels, className }: Props) {
  const state = stockBadgeState(stock, lowThreshold);
  if (!state) return null;
  return (
    <Pill tone={tones[state]} className={className}>
      {fillTemplate(labels[state], { n: stock ?? 0 })}
    </Pill>
  );
}
